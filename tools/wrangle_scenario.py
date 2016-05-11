# coding=utf-8
import json
import sys
import numpy as np
import pandas as pd
import re

STRING_MAP = [
    # currents
    ["BatHW_I_BatCur", "seriesId", "current_bat"],
    ["BMS_I_BatLimChCurMax", "seriesId", "current_max"],
    ["BMS_I_BatLimDChCurMax", "seriesId", "current_min"],
    # sco
    ["BatHW_prc_BatSoc", "seriesId", "soc"],
    # voltages
    ["BatHW_V_BatVolt", "seriesId", "voltage_bat"],
    ["BatHW_V_OpenCircVolt", "seriesId", "voltage_oc"],
    ["BMS_V_BatLimVoltMax", "seriesId", "voltage_max"],
    ["BMS_V_BatLimVoltMin", "seriesId", "voltage_min"],
    ["BatHW_prc_BatSoc", "seriesId", "soc"],
    # temperatures
    ["BatHW_T_BatTpMin", "seriesId", "temp_min"],
    ["BatHW_T_BatTpMean", "seriesId", "temp_mean"],
    ["BatHW_T_BatTpMax", "seriesId", "temp_max"],
    ["BatHW_T_CooltOutletTp", "seriesId", "temp_outlet"],
    ["T_Cell_([0-9]+)", "seriesId", "cell_\\1"],
    # labels for metrics
    ["BatHW_prc_BatSoc", "metricLabel", "State-of-Charge"],
    ["(BatHW_V_BatVolt|BatHW_V_OpenCircVolt|BMS_V_BatLimVoltMax|BMS_V_BatLimVoltMin|BatHW_prc_BatSoc)",
        "metricLabel", "Voltages (U)"],
    ["(BatHW_I_BatCur|BMS_I_BatLimChCurMax|BMS_I_BatLimDChCurMax)", "metricLabel", "Current (I)"],
    ["(BatHW_T_BatTpMeanRef|BatHW_T_BatTpMin|BatHW_T_BatTpMax|BatHW_T_BatTpMean|BatHW_T_CooltOutletTp)",
        "metricLabel", "Temperatures"],
    ["T_Cell_([0-9]+)", "metricLabel", "Temperature of 10 Packs With 10 Cells Each"],
    # units for metrics
    ["Currents", "metricUnit", "A"],
    ["Currents", "metricUnit", "A"],
    ["Degree C", "metricUnit", u"°C"],
    ["Percent", "metricUnit", "%"],
]

IGNORE_SERIESES = ["temp_meanRef", "BatHW_T_BatTpMeanRef"]

METRIC_COLOR_MAP = {
    "Temperatures": [[-50,"#4575b4"],[0,"#e0f3f8"],[40,"#e0f3f8"],[60,"#ffeda0"], [70,"#feb24c"], [75,"#f03b20"]],
    "TemperaturesCells": [[-50,"#4575b4"],[0,"#e0f3f8"],[40,"#e0f3f8"],[60,"#ffeda0"], [70,"#feb24c"], [75,"#f03b20"]],
    "Currents": [[-3200,"#762a83"], [-2000, "#e7d4e8"], [+1000, "#d9f0d3"], [+2000, "#1b7837"]],
    "Voltages": [[680,"#bdc9e1"], [1200,"#045a8d"]]
}

SERIES_CORRECT_FACTOR = {
    "BatHW_I_BatCur": 0.5
}

SERIES_COLORS = {
    "voltage_limit": "gray",
    "current_min": "gray",
    "current_max": "gray",
    "voltage_min": "gray",
    "voltage_max": "gray",
    "temp_outlet": "gray",
    "voltage_oc": "#045a8d",
}

NUM_CELLS = 100
NUM_CELL_SEGMENTS = 10



def repairString(sourceString, stringType):
    for s in STRING_MAP:
        if stringType == s[1]:
            sourceString = re.sub(s[0], s[2], sourceString)
    return sourceString

def repairDataTime(sourceData, sourceTime, seriesId):
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
    if seriesId in SERIES_CORRECT_FACTOR.keys():
        dataFrameClean.data *= SERIES_CORRECT_FACTOR[seriesId]
    targetData = [round(d,4) for d in list(dataFrameClean.data)]
    targetTime = [round(d,4) for d in list(dataFrameClean.time)]
    return targetData, targetTime

def repairSeries(seriesId, sourceSeries, fallbackTime = None):
    sourceTime = sourceSeries["time"] if "time" in sourceSeries else fallbackTime
    targetData, targetTime = repairDataTime(sourceSeries["data"], sourceTime, seriesId)
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

def addSeries(scenario, metricId, seriesId, dataframeSeries, color = None):
    d = [round(v,4) for v in list(dataframeSeries)]
    t = [round(v,4) for v in list(dataframeSeries.index.values)]
    for metric in scenario:
        if (metric["id"] == metricId):
            series = {"id": seriesId, "data": d, "time": t}
            if (color is not None):
                series["color"] = color
            metric["serieses"].append(series)

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
    targetMetric["label"] = repairString(sourceMetric[sourceMetric.keys()[0]]["label"], "metricLabel")
    targetMetric["unit"]  = repairString(sourceMetric[sourceMetric.keys()[0]]["unit"], "metricUnit")
    targetMetric["serieses"] = repairSerieses(metricId, sourceMetric, fallbackTime)
    if (metricId in METRIC_COLOR_MAP):
        targetMetric["dataColorMap"] = METRIC_COLOR_MAP[metricId]
    return targetMetric

def addMetric(scenario, metricId, metricLabel, metricUnit):
    metric = {
        "id": metricId,
        "label": metricLabel,
        "unit": metricUnit,
        "serieses": []
    }
    scenario.append(metric)

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
    df["Powers.power_loss"] = abs(df["Voltages.voltage_bat"]-df["Voltages.voltage_oc"]) * df["Voltages.voltage_oc"]
    df["Powers.power_bat"] = df["Currents.current_bat"] * df["Voltages.voltage_bat"] / 1000
    df["Efficiencies.efficiency"] = df["Voltages.voltage_bat"]/(df["Voltages.voltage_oc"]+df["Voltages.voltage_bat"]) * 100
    for i in range(0, NUM_CELLS/NUM_CELL_SEGMENTS):
        dfcol = df["TemperaturesCells.cells_" + str(i)] = pd.Series(index=df.index).fillna(0.)
        for j in range(0, NUM_CELL_SEGMENTS):
            dfcol += df["TemperaturesCells.cell_" + str(i+j+1)]
        dfcol /= NUM_CELL_SEGMENTS
        df["TemperaturesCells.cells_" + str(i)] = dfcol
    return df

def extendAndRemoveMetrics(scenario, df):
    addMetric(scenario, "Powers", "Powers (P = U·I)", "kW")
    addSeries(scenario, "Powers", "power_loss", df["Powers.power_loss"].dropna(), "gray")
    addSeries(scenario, "Powers", "power_bat", df["Powers.power_bat"].dropna())
    addMetric(scenario, "Efficiencies", "Efficiency (ρ)", "%")
    addSeries(scenario, "Efficiencies", "efficiency", df["Efficiencies.efficiency"].dropna())
    for metric in scenario:
        if metric["id"] == "TemperaturesCells":
            metric["serieses"] = []
    for i in range(0, NUM_CELLS/NUM_CELL_SEGMENTS):
        addSeries(scenario, "TemperaturesCells", "cells_" + str(i), df["TemperaturesCells.cells_" + str(i)].dropna())
    return scenario

def wrangleScenarioFile(sourceJsonName, targetJsonName, targetCsvName):
    with open(sourceJsonName, "r") as sourceJson:
        sourceScenario = json.load(sourceJson)
    repairedScenario = repairScenario(sourceScenario)
    targetDataFrame = scenarioToExtendedDataFrame(repairedScenario)
    targetScenario = extendAndRemoveMetrics(repairedScenario, targetDataFrame)
    targetDataFrame.to_csv(targetCsvName,index=True)
    with open(targetJsonName, "wb") as targetJson:
        json.dump(targetScenario, targetJson, encoding="utf-8")

if __name__ == '__main__':
    pathName = sys.argv[1]
    fileName = sys.argv[2]
    wrangleScenarioFile(pathName + "/" + fileName + ".json",
                        pathName + "/scenario-" + fileName + ".json",
                        pathName + "/scenario-" + fileName + ".csv")
