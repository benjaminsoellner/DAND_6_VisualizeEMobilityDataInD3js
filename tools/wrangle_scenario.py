# coding=utf-8
import json
import sys
import numpy as np
import pandas as pd
import re

STRING_MAP = [
    # currents
    ["BMS_I_BatLimDChCurMax", "seriesId", "current_bat"],
    # sco
    ["BatHW_prc_BatSoc", "seriesId", "soc"],
    # voltages
    ["BatHW_V_BatVolt", "seriesId", "voltage_bat"],
    ["BatHW_V_OpenCircVolt", "seriesId", "voltage_oc"],
    ["BMS_V_BatLimVoltMin", "seriesId", "voltage_limit"],
    ["BatHW_prc_BatSoc", "seriesId", "soc"],
    # temperatures
    ["BatHW_T_BatTpMin", "seriesId", "temp_min"],
    ["BatHW_T_BatTpMean", "seriesId", "temp_mean"],
    ["BatHW_T_BatTpMax", "seriesId", "temp_max"],
    ["BatHW_T_CooltOutletTp", "seriesId", "temp_outlet"],
    ["T_Cell_([0-9]+)", "seriesId", "cell_\\1"],
    # labels for metrics
    ["BatHW_prc_BatSoc", "metricLabel", "State-of-Charge"],
    ["(BatHW_V_BatVolt|BatHW_V_OpenCircVolt|BMS_V_BatLimVoltMin)",
        "metricLabel", "Voltages (U)"],
    ["BMS_I_BatLimDChCurMax", "metricLabel", "Current (I)"],
    ["(BatHW_T_BatTpMeanRef|BatHW_T_BatTpMin|BatHW_T_BatTpMax|BatHW_T_BatTpMean|BatHW_T_CooltOutletTp)",
        "metricLabel", "Temperatures"],
    ["T_Cell_([0-9]+)", "metricLabel", "Mean Temperature of 10x10-Cell Packs"],
    # units for metrics
    ["Currents", "metricUnit", "A"],
    ["Currents", "metricUnit", "A"],
    ["Degree C", "metricUnit", u"°C"],
    ["Percent", "metricUnit", "%"],
]

IGNORE_SERIESES = ["temp_meanRef", "BatHW_T_BatTpMeanRef"]

METRIC_COLOR_MAP = {
    "Temperatures": [[-50,"#4575b4"],[0,"#e0f3f8"],[50,"#ffeda0"], [60,"#feb24c"], [75,"#f03b20"]],
    "TemperaturesCells": [[-50,"#4575b4"],[0,"#e0f3f8"],[50,"#ffeda0"], [60,"#feb24c"], [75,"#f03b20"]],
    "Currents": [[-3390,"#762a83"], [-2000, "#e7d4e8"], [+2000, "#d9f0d3"], [+3390, "#1b7837"]],
    "Voltages": [[650,"#bdc9e1"], [930,"#045a8d"]]
}

SERIES_COLORS = {
    "voltage_limit": "gray"
}

NUM_CELLS = 100
NUM_CELL_SEGMENTS = 10



def repairString(sourceString, stringType):
    for s in STRING_MAP:
        if stringType == s[1]:
            sourceString = re.sub(s[0], s[2], sourceString)
    return sourceString

def repairDataTime(sourceData, sourceTime):
    # create equidistant time spacing
    timeInitial = sourceTime[0]
    timeSpacing = sourceTime[1]-sourceTime[0]
    timeCount = len(sourceTime)
    timeList = []
    for i in range(0,timeCount,1):
        timeList.append(round(timeInitial+i*timeSpacing,4))
    # Data is okay, but we might need to handle outliers
    dataList = sourceData
    # Cleaning outliers by keeping only values +/- 3 std devs from mean
    dataFrame = pd.DataFrame({'data': dataList, 'time': timeList}, dtype=float)
    distToMed = np.abs(dataFrame.data-dataFrame.data.median())
    medDev = np.median(distToMed)
    if medDev:
        s = distToMed/medDev
        dataFrameClean = dataFrame[s<2.]
    else:
        dataFrameClean = dataFrame
    # Serialize content
    targetData = [round(d,4) for d in list(dataFrameClean.data)]
    targetTime = [round(d,4) for d in list(dataFrameClean.time)]
    return targetData, targetTime

def repairSeries(seriesId, sourceSeries, fallbackTime = None):
    sourceTime = sourceSeries["time"] if "time" in sourceSeries else fallbackTime
    targetData, targetTime = repairDataTime(sourceSeries["data"], sourceTime)
    targetSeriesId = repairString(seriesId, "seriesId")
    targetSeries = {
        "id": targetSeriesId,
        "data": targetData,
        "time": targetTime
    }
    if targetSeriesId in SERIES_COLORS:
        targetSeries["color"] = SERIES_COLORS[targetSeriesId]
    if "SignalDescription" in sourceSeries:
        targetSeries["label"] = sourceSeries["SignalDescription"]
    return targetSeries

def addSeries(scenario, metricId, seriesId, dataframeSeries):
    d = [round(v,4) for v in list(dataframeSeries)]
    t = [round(v,4) for v in list(dataframeSeries.index.values)]
    for metric in scenario:
        if (metric["id"] == metricId):
            metric["serieses"].append(
                {"id": seriesId, "data": d, "time": t} )

def repairSerieses(metricId, sourceMetric, fallbackTime = None):
    targetSerieses = []
    for seriesId in sourceMetric:
        if seriesId not in IGNORE_SERIESES:
            sourceSeries = sourceMetric[seriesId]
            if "time" in sourceSeries:
                fallbackTime = sourceSeries["time"]
            targetSerieses.append(
                repairSeries(seriesId, sourceMetric[seriesId], fallbackTime))
    return targetSerieses

def repairMetric(metricId, sourceMetric, fallbackTime):
    targetMetric = {}
    targetMetric["id"] = repairString(metricId, "metricId")
    if metricId == "Currents":
        targetMetric["label"] = repairString(sourceMetric["label"], "metricLabel")
        targetMetric["unit"]  = repairString(sourceMetric["unit"], "metricUnit")
        targetMetric["serieses"] = [repairSeries("current_bat", sourceMetric)]
    else:
        targetMetric["label"] = repairString(sourceMetric[sourceMetric.keys()[0]]["label"], "metricLabel")
        targetMetric["unit"]  = repairString(sourceMetric[sourceMetric.keys()[0]]["unit"], "metricUnit")
        targetMetric["serieses"] = repairSerieses(metricId, sourceMetric, fallbackTime)
    if (metricId in METRIC_COLOR_MAP):
        targetMetric["dataColorMap"] = METRIC_COLOR_MAP[metricId]
    return targetMetric

def addMetric(scenario, metricId, metricLabel, metricUnit):
    scenario.append({
        "id": metricId,
        "label": metricLabel,
        "unit": metricUnit,
        "serieses": []
    })

def repairScenario(sourceScenario):
    targetScenario = []
    fallbackTime = None
    for metricId in sourceScenario:
        sourceMetric = sourceScenario[metricId]
        firstSeries = sourceMetric[sourceMetric.keys()[0]]
        if "time" in firstSeries:
            fallbackTime = firstSeries["time"]
        targetScenario.append(
            repairMetric(metricId, sourceScenario[metricId], fallbackTime))
    return targetScenario

def scenarioToDataFrame(scenario):
    dataFrame = pd.DataFrame()
    for metric in scenario:
        metricId = metric["id"]
        for series in metric["serieses"]:
            seriesId = series["id"]
            newDataFrame = pd.DataFrame({metricId + "." + seriesId: series["data"]}, index=series["time"])
            dataFrame = dataFrame.join(newDataFrame, how="outer")
    return dataFrame

def scenarioToExtendedDataFrame(scenario):
    df = scenarioToDataFrame(scenario)
    df["Powers.power_int"] = df["Currents.current_bat"] * df["Voltages.voltage_oc"] / 1000
    df["Powers.power_bat"] = df["Currents.current_bat"] * df["Voltages.voltage_bat"] / 1000
    df["Resistances.resistance_int"] = (df["Voltages.voltage_bat"]-df["Voltages.voltage_oc"]) / df["Currents.current_bat"]
    df["Efficiencies.efficiency"] = df["Powers.power_int"]/df["Powers.power_bat"] * 100
    for i in range(0, NUM_CELLS/NUM_CELL_SEGMENTS):
        dfcol = df["TemperaturesCells.cells_" + str(i)] = pd.Series(index=df.index).fillna(0.)
        for j in range(0, NUM_CELL_SEGMENTS):
            dfcol += df["TemperaturesCells.cell_" + str(i+j+1)]
        dfcol /= NUM_CELL_SEGMENTS
        addSeries(scenario, "TemperaturesCells", "cells_" + str(i), dfcol.dropna())
    return df

def extendAndRemoveMetrics(scenario, df):
    addMetric(scenario, "Powers", "Powers (P = U·I)", "kW")
    addSeries(scenario, "Powers", "power_int", df["Powers.power_int"].dropna())
    addSeries(scenario, "Powers", "power_bat", df["Powers.power_bat"].dropna())
    addMetric(scenario, "Resistances", "Resistance (R = ΔU/I)", "Ω")
    addSeries(scenario, "Resistances", "resistance_int", df["Resistances.resistance_int"].dropna())
    addMetric(scenario, "Efficiencies", "Efficiency (ρ)", "%")
    addSeries(scenario, "Efficiencies", "efficiency", df["Efficiencies.efficiency"].dropna())
    for metric in scenario:
        if metric["id"] == "TemperaturesCells":
            metric["serieses"] = []
    return scenario

def wrangleScenarioFile(sourceJsonName, targetJsonName, targetCsvName):
    with open(sourceJsonName, "r") as sourceJson:
        sourceScenario = json.load(sourceJson)
    repairedScenario = repairScenario(sourceScenario)
    targetDataFrame = scenarioToExtendedDataFrame(repairedScenario)
    targetScenario = extendAndRemoveMetrics(repairedScenario, targetDataFrame)
    targetDataFrame.to_csv(targetCsvName)
    with open(targetJsonName, "wb") as targetJson:
        json.dump(targetScenario, targetJson, encoding="utf-8")

if __name__ == '__main__':
    fileName = sys.argv[1]
    wrangleScenarioFile(fileName + ".json", fileName + "_out.json", fileName + ".csv")
