library(httr)
library(jsonlite)
library(plotly)

url <- 'https://WIN-09USCP1J3QT:1338/v1/doc/002420fe-9858-4212-9da8-3ce00d5be660/hypercube/json'

body <- '{
    "qInfo": {
        "qId": "",
        "qType": "HyperCube"
    },
    "qHyperCubeDef": {
        "qDimensions": [
            {
                "qDef": {
                    "qGrouping": "N",
                    "qFieldDefs": [
                        "Date.autoCalendar.Date"
                    ],
                    "qFieldLabels": [
                        "Date"
                    ],
                    "qSortCriterias": [
                        {
                            "qSortByNumeric": 1,
                            "qSortByLoadOrder": 1,
                            "qExpression": {}
                        }
                    ],
                    "qNumberPresentations": [],
                    "qActiveField": 0,
                    "autoSort": true,
                    "cId": "hwjAmT",
                    "othersLabel": "Others"
                },
                "qNullSuppression": true,
            }
        ],
        "qMeasures": [
            {
                "qLibraryId": "XpPvDqf",
                "qDef": {
                    "qTags": [],
                    "qGrouping": "N",
                    "qNumFormat": {
                        "qType": "F",
                        "qnDec": 10,
                        "qUseThou": 0
                    }
                },
                "qSortBy": {
                    "qSortByNumeric": -1,
                    "qSortByLoadOrder": 1,
                    "qExpression": {}
                }
            },
            {
                "qLibraryId": "FCzjwjd",
                "qDef": {
                    "qTags": [],
                    "qGrouping": "N",
                    "qNumFormat": {
                        "qType": "F",
                        "qnDec": 10,
                        "qUseThou": 0
                    }
                },
                "qSortBy": {
                    "qSortByNumeric": -1,
                    "qSortByLoadOrder": 1,
                    "qExpression": {}
                }
            }
        ],
        "qInterColumnSortOrder": [
            0,
            2,
            1
        ],
        "qSuppressZero": true,
        "qSuppressMissing": true,
        "qInitialDataFetch": [
            {
                "qLeft": 0,
                "qTop": 0,
                "qWidth": 3,
                "qHeight": 500
            }
        ],
    }
}'

r <- POST(url, body = body, encode = "json")

d <- fromJSON(content(r, "text"))
# reshape if needed:
# d <- d[c("Cumulative New Cases", "Cumulative Closed Cases", "Date")]
plot_ly(data = d, x = d$`Cumulative New Cases`, y = d$`Cumulative Closed Cases`)
