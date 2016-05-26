# coding=utf-8
import pandas as pd
import json

SERIESES = [
        {
            "id": "winter",
            "color": "#1f78b4",
            "color_outside": "#a6cee3",
            "label": "Harsh Winter Conditions",
            "properties": {
                "markers": [{"t": 190.0, "coords": ["t"]}],
                "annotations": [{"x": -33.0, "y": 90.0, "color": "#1f78b4",
                    "anchor": "start", "lines": ["Harsh Winter Conditions"]}],
                "stickers": [
                        {"src": "summary-winter-comic.svg",
                            "x0": -30, "y0": 85, "x1": -10, "y1": 78},
                        {"src": "summary-winter-190s.svg",
                            "x0": -47, "y0": 87, "x1": -43.33, "y1": 89.5}
                    ]
            }
        }, {
            "id": "rangecert",
            "color": "#33a02c",
            "color_outside": "#b2df8a",
            "label": "Normal Driving + Range (NEFZ Certification Cycle)",
            "properties": {
                "markers": [{"t": 190.0, "coords": ["t"]}],
                "annotations": [{"x": 60.0, "y": 103.0, "color": "#33a02c",
                    "anchor": "end",
                    "lines": ["Normal Driving + Range","(NEFZ Certification Cycle)"]}],
                "stickers": [
                        {"src": "summary-rangecert-comic.svg",
                            "x0": 40, "y0": 95, "x1": 60, "y1": 88},
                        {"src": "summary-rangecert-190s.svg",
                            "x0": 64.0, "y0": 99.4, "x1": 62.0, "y1": 97.3}

                    ]
            }
        }, {
            "id": "acceleratenbreak",
            "color": "#e31a1c",
            "color_outside": "#fb9a99",
            "label": "Sportive Driving (Accelerate & Break + WLTP Cycle)",
            "properties": {
                "markers": [{"t": 190.0, "coords": ["t"]}],
                "annotations": [{"x": 65.0, "y": 53.0, "color": "#e31a1c", "anchor": "end",
                    "lines": ["Sportive Driving", "(Accelerate & Break + WLTP Cycle)"]}],
                "stickers": [
                        {"src": "summary-acceleratenbreak-comic.svg",
                            "x0": 45, "y0": 45, "x1": 65, "y1": 38},
                        {"src": "summary-acceleratenbreak-190s.svg",
                            "x0": 65.7, "y0": 34.4, "x1": 75.8, "y1": 45.4},

                    ]
            }
        }
    ]
BANDPASS = [0.0, 190.0]

def summaryDfToJson(dataFrame):
    targetJson = []
    targetMetric = {
        "id": "temp_mean_vs_soc",
        "xlabel": "Mean Temperature of Electric Car Battery",
        "xunit": u'°C',
        "ylabel": "State-of-Charge of Electric Car Battery",
        "yunit": "%",
        "tlabel": "Time",
        "tunit": " seconds",
        "serieses": []
    }
    targetJson.append(targetMetric)
    x = "Temperatures.temp_mean"
    y = "SOCs.soc"
    for series in SERIESES:
        subdf = dataFrame[dataFrame["scenario"] == series["id"]][[x,y]].dropna()
        inside = subdf[(subdf.index>=BANDPASS[0])&(subdf.index <= BANDPASS[1])]
        outside = subdf[(subdf.index<BANDPASS[0])|(subdf.index > BANDPASS[1])]
        targetSeriesInside = {
                "id": series["id"],
                "label": series["label"],
                "color": series["color"],
                "time": [round(v,4) for v in list(inside.index.values)],
                "x": [round(v,4) for v in list(inside[x])],
                "y": [round(v,4) for v in list(inside[y])],
                "url": "#explain?scenarioId=" + series["id"]
            }
        targetSeriesOutside = {
                "id": series["id"] + "_outside",
                "label": series["label"],
                "color": series["color_outside"],
                "time": [round(v,4) for v in list(outside.index.values)],
                "x": [round(v,4) for v in list(outside[x])],
                "y": [round(v,4) for v in list(outside[y])],
                "url": "#explain?scenarioId=" + series["id"]
            }
        for propertyKey in series["properties"].keys():
            targetSeriesInside[propertyKey] = series["properties"][propertyKey]
        targetMetric["serieses"].append(targetSeriesOutside)
        targetMetric["serieses"].append(targetSeriesInside)
    return targetJson

def wrangleSummaryFile(sourceCsvName, targetJsonName):
    dataFrame = pd.DataFrame.from_csv(sourceCsvName, index_col="X")
    targetSummary = summaryDfToJson(dataFrame)
    with open(targetJsonName, "wb") as targetJson:
        json.dump(targetSummary, targetJson, encoding="utf-8")

if __name__ == '__main__':
    wrangleSummaryFile("../rawdata/summary.csv",
                           "../rawdata/summary.json")
