senser_data <- function(host,port,app,hyperCubeDef,fields) {
  library(httr)
  library(jsonlite)
  library(dplyr)

  app <- URLencode(app)
  print( ifelse( is.null(host), 'qrisotto host not specified', paste('host =',host) ) )
  print( ifelse( is.null(port), 'qrisotto port not specified', paste('port =',port) ) )
  print( ifelse( is.null(app), 'app id not specified', paste('app =',app) ) )
  print( ifelse( is.null(hyperCubeDef), 'hyperCubeDef not specified', 'hyperCubeDef =' ) )
  print( hyperCubeDef )
  print( ifelse( is.null(fields), 'fields not specified', 'fields =' ) )
  print( fields )

  # url <- "https://WIN-09USCP1J3QT:1338/v1/doc/002420fe-9858-4212-9da8-3ce00d5be660/hypercube/json"
  
  urlSize <- paste(host, ":", port, "/v1/doc/", app, "/hypercube/size", sep="")
  url <- paste(host, ":", port, "/v1/doc/", app, "/hypercube/json", sep="")
  # print( paste('url =', url) )
  
  r <- POST(urlSize, body = toJSON(hyperCubeDef), encode = "json", config = httr::config(ssl_verifypeer = FALSE))
  size <- fromJSON(content(r, "text"))
  
  if (size$pages > 1) {
    pages <- size$pages[1]
    d <- vector(mode = "list", length = pages)
    for (i in 1:pages) {
      url <- paste(host, ":", port, "/v1/doc/", app, "/hypercube/json/", i, sep="")
      r <- POST(url, body = toJSON(hyperCubeDef), encode = "json", config = httr::config(ssl_verifypeer = FALSE))
      d[[i]] <- fromJSON(content(r, "text"))
    }
    d <- dplyr::bind_rows(d)
  } else {
    r <- POST(url, body = toJSON(hyperCubeDef), encode = "json", config = httr::config(ssl_verifypeer = FALSE))
    d <- fromJSON(content(r, "text"))
  }
  names(d) <- fields

  return(d)
} 

senser_timeline <- function(host,port,app,hyperCubeDef,fields,tz="UTC") {
  # 1st field needs to contain the date/timestamp values
  library(lubridate);

  # get the data from Qlik Sense
  d <- senser_data(host,port,app,hyperCubeDef,fields)

  # convert date/timestamp result into POSIXct vector
  d[[1]] <- lubridate::ymd_hms(d[[1]],tz=tz)
  
  # order by date/timestamp field
  d <- d[order(d[[1]], d[[2]]),]

  # add a row number field (now used for DataRobot integration)
  d$rowno <- seq.int(nrow(d))

  return(d)
}

senser_timeline_fmt <- function(host,port,app,hyperCubeDef,fields,tz="UTC", format="%d.%m.%Y") {
  # 1st field needs to contain the date/timestamp values
  library(lubridate);

  # get the data from Qlik Sense
  d <- senser_data(host,port,app,hyperCubeDef,fields)

  # convert date/timestamp result into POSIXct vector
  d[[1]] <- lubridate::ymd_hms(d[[1]],tz=tz)

  # order by date/timestamp field
  d <- d[order(d[[1]], d[[2]]),]

  # add a row number field (used for DataRobot integration)
  d$rowno <- seq.int(nrow(d))

  # format the date/timestamp field (used for DataRobot integration)
  d[[1]] <- format(d[[1]], format=format)

  return(d)
}

Sys.setenv(TZ="Europe/Berlin")

host <- "http://localhost"
port <- 3000
app <- "Helpdesk Management.qvf"

# sinple way, define HyperCube fields as vector
hyperCubeDef <- c("Date.autoCalendar.Date", "=Count( {$<[Case Is Closed] ={'True'} >} Distinct %CaseId )", "=Count( {$<[Status]={'New'} >} Distinct %CaseId )")
fields <- c("Date", "Closed Cases", "New Cases")

# HyperCube fields or definition as JSON string, notice quote escaping, could be a comnplete qHyperCubeDef object too
# library(jsonlite)
# hyperCubeDef <- fromJSON('["Date.autoCalendar.Date", "=Count( {$<[Case Is Closed] ={\'True\'} >} Distinct %CaseId )", "=Count( {$<[Status]={\'New\'} >} Distinct %CaseId )"]')

# make the call against q-risotto Qlik Core
d <- senser_timeline(host=host,port=port,app=app,hyperCubeDef=hyperCubeDef,fields=fields,tz="GMT")

# make the call against q-risotto with Qlik Sense server
# d <- senser_data(host="https://WIN-09USCP1J3QT",port=1338,app="326fd5f7-a2fd-4dc3-9d41-3c80bb0e3198",hyperCubeDef=hyperCubeDef,fields=c("Date", "Closed Cases", "New Cases"))

library(plotly)
plot_ly(data = d, x = ~`New Cases`, y = ~`Closed Cases`)
# plot_ly(data = d, x = ~`Date`, y = ~`Closed Cases`, name = 'Closed Cases', type = 'scatter', mode = 'lines+markers') %>%
#    add_trace(y = ~`New Cases`, name = 'New Cases', mode = 'lines+markers')
