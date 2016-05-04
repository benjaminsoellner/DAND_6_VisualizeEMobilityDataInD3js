import json
import sys
import numpy as np

source = sys.argv[1]
dest   = sys.argv[2]

def repairData(sourceData):
    return sourceData

def repairTime(sourceTime):
    initial = sourceTime[0]
    spacing = sourceTime[1]-sourceTime[0]
    count = len(sourceTime)
    targetTime = []
    for i in range(0,count,1):
        targetTime.append(round(initial+i*spacing,4))
    return targetTime

def repairSeries(seriesId, sourceSeries):
    targetSeries = {
        "id": seriesId,
        "data": repairData(sourceSeries["data"]),
        "time": repairTime(sourceSeries["time"])
    }
    return targetSeries

def repairSerieses(sourceMetric):
    targetSerieses = []
    for seriesId in sourceMetric:
        targetSerieses.append(repairSeries(seriesId, sourceMetric[seriesId]))
    return targetSerieses

def repairMetric(metricId, sourceMetric):
    targetMetric = {}
    targetMetric["id"] = metricId
    if metricId == "Currents":
        targetMetric["label"] = sourceMetric["label"]
        targetMetric["unit"]  = sourceMetric["unit"]
        targetMetric["serieses"] = [repairSeries("Current", sourceMetric)]
    else:
        targetMetric["label"] = sourceMetric[sourceMetric.keys()[0]]["label"]
        targetMetric["unit"]  = sourceMetric[sourceMetric.keys()[0]]["unit"]
        targetMetric["serieses"] = repairSerieses(sourceMetric)
    return targetMetric

def repairScenario(sourceScenario):
    targetScenario = []
    for metricId in sourceScenario:
        targetScenario.append(repairMetric(metricId, sourceScenario[metricId]))
    return targetScenario

def repairScenarioFile(sourceFile, targetFile):
    with open(sourceFile, "r") as sourceJson:
        sourceScenario = json.load(sourceJson)
    targetScenario = repairScenario(sourceScenario)
    with open(targetFile, "wb") as targetJson:
        json.dump(targetScenario, targetJson)

if __name__ == '__main__':
    sourceFile = sys.argv[1]
    targetFile = sys.argv[2]
    repairScenarioFile(sourceFile, targetFile)
