# coding=utf-8
import json
import sys
import numpy as np
import pandas as pd

STRING_MAP = [
    ["BatHW_I_BatCur", "seriesId", "current"],
    ["BatHW_V_BatVolt", "seriesId", "voltage_battery"],
    ["BatHW_V_OpenCircVolt", "seriesId", "voltage_cutoff"],
    ["BatHW_prc_BatSoc", "seriesId", "soc"],
    ["BatHW_T_BatTpMin", "seriesId", "temperature_3"],
    ["BatHW_T_BatTpMean", "seriesId", "temperature_2"],
    ["BatHW_T_BatTpMax", "seriesId", "temperature_1"],
    ["BatHW_T_CooltOutletTp", "seriesId", "temperature_outlet"],
    ["BatHW_prc_BatSoc", "metricLabel", "State-of-Charge"],
    ["Currents", "metricUnit", "A"],
    ["BatHW_V_BatVolt", "metricLabel", "Voltage"],
    ["BatHW_I_BatCur", "metricLabel", "Current"],
    ["BatHW_T_BatTpMin", "metricLabel", "Temperature"],
    ["Currents", "metricUnit", "A"],
    ["Degree C", "metricUnit", "°C"],
    ["Percent", "metricUnit", "%"],
]

IGNORE_SERIESES = ["BatHW_T_CooltOutletTp"]

METRIC_COLOR_MAP = {
    "Temperatures": [[64,"#ffeda0"], [70,"#feb24c"], [77,"#f03b20"]],
    "Currents": [[-600,"#762a83"], [-10, "#e7d4e8"], [+10, "#d9f0d3"], [+1000, "#1b7837"]]
}

SERIES_COLOR_MAP = {
    "voltage_cutoff": "gray"
}

def wrangleString(sourceString, stringType):
    for s in STRING_MAP:
        if s[0] == sourceString and s[1] == stringType:
            return s[2]
    return sourceString

def wrangleDataTime(sourceData, sourceTime):
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
    dataFrameClean = dataFrame[
        np.abs(dataFrame.data-dataFrame.data.mean())<=(3*dataFrame.data.std())]
    # Serialize content
    targetData = [round(d,4) for d in list(dataFrameClean.data)]
    targetTime = [round(d,4) for d in list(dataFrameClean.time)]
    return targetData, targetTime

def wrangleSeries(seriesId, sourceSeries):
    targetData, targetTime = wrangleDataTime(sourceSeries["data"], sourceSeries["time"])
    targetSeriesId = wrangleString(seriesId, "seriesId")
    targetSeries = {
        "id": targetSeriesId,
        "data": targetData,
        "time": targetTime
    }
    if targetSeriesId in SERIES_COLOR_MAP:
        targetSeries["color"] = SERIES_COLOR_MAP[targetSeriesId]
    return targetSeries

def wrangleSerieses(sourceMetric):
    targetSerieses = []
    for seriesId in sourceMetric:
        if seriesId not in IGNORE_SERIESES:
            targetSerieses.append(wrangleSeries(seriesId, sourceMetric[seriesId]))
    return targetSerieses

def wrangleMetric(metricId, sourceMetric):
    targetMetric = {}
    targetMetric["id"] = metricId
    if metricId == "Currents":
        targetMetric["label"] = wrangleString(sourceMetric["label"], "metricLabel")
        targetMetric["unit"]  = wrangleString(sourceMetric["unit"], "metricUnit")
        targetMetric["serieses"] = [wrangleSeries("current", sourceMetric)]
    else:
        targetMetric["label"] = wrangleString(sourceMetric[sourceMetric.keys()[0]]["label"], "metricLabel")
        targetMetric["unit"]  = wrangleString(sourceMetric[sourceMetric.keys()[0]]["unit"], "metricUnit")
        targetMetric["serieses"] = wrangleSerieses(sourceMetric)
    if (metricId in METRIC_COLOR_MAP):
        targetMetric["dataColorMap"] = METRIC_COLOR_MAP[metricId]
    return targetMetric

def wrangleScenario(sourceScenario):
    targetScenario = []
    for metricId in sourceScenario:
        targetScenario.append(wrangleMetric(metricId, sourceScenario[metricId]))
    return targetScenario

def wrangleScenarioFile(sourceFile, targetFile):
    with open(sourceFile, "r") as sourceJson:
        sourceScenario = json.load(sourceJson)
    targetScenario = wrangleScenario(sourceScenario)
    with open(targetFile, "wb") as targetJson:
        json.dump(targetScenario, targetJson, encoding="utf-8")

if __name__ == '__main__':
    sourceFile = sys.argv[1]
    targetFile = sys.argv[2]
    wrangleScenarioFile(sourceFile, targetFile)
