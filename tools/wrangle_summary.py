# coding=utf-8
import pandas as pd
import json

SERIESES = ["winter", "rangecert", "acceleratenbreak"]
SERIESES_LABELS = [
        "Harsh Winter Conditions",
        "Normal Driving + Range (NEFZ Certification Cycle)",
        "Sportive Driving (Accelerate & Break + WLTP Cycle)"
    ]
SCENARIO_COLORS = ["blue", "green", "red"]

def summaryDfToJson(dataFrame):
    targetJson = []
    targetMetric = {
        "id": "temp_mean_vs_soc",
        "xlabel": "Temperature",
        "xunit": u'°C',
        "ylabel": "State-of-Charge",
        "yunit": "%",
        "serieses": []
    }
    targetJson.append(targetMetric)
    x = "Temperatures.temp_mean"
    y = "SOCs.soc"
    for seriesId, seriesLabel, seriesColor in \
            zip(SERIESES, SERIESES_LABELS, SCENARIO_COLORS):
        subdf = dataFrame[[x,y]].dropna()
        targetSeries = {
                "id": seriesId,
                "label": seriesLabel,
                "color": seriesColor,
                "time": [round(v,4) for v in list(subdf.index.values)],
                "x": [round(v,4) for v in list(subdf[x])],
                "y": [round(v,4) for v in list(subdf[y])],
                "url": "#explain?scenarioId=" + seriesId
            }
        targetMetric["serieses"].append(targetSeries)
    return targetJson

def wrangleSummaryFile(sourceCsvName, targetJsonName):
    dataFrame = pd.DataFrame.from_csv(sourceCsvName, index_col="X")
    targetSummary = summaryDfToJson(dataFrame)
    with open(targetJsonName, "wb") as targetJson:
        json.dump(targetSummary, targetJson, encoding="utf-8")

if __name__ == '__main__':
    wrangleSummaryFile("../rawdata/summary.csv",
                           "../rawdata/summary.json")
