senser_data <- function(host,port,app,payload,fields) {
  library(httr)
  library(jsonlite)

  print( ifelse( is.null(host), 'qrisotto host not specified', paste('host =',host) ) )
  print( ifelse( is.null(port), 'qrisotto port not specified', paste('port =',port) ) )
  print( ifelse( is.null(app), 'app id not specified', paste('app =',app) ) )
  print( ifelse( is.null(payload), 'payload not specified', 'payload =' ) )
  print( payload )
  print( ifelse( is.null(fields), 'payload not specified', 'fields =' ) )
  print( fields )

  # url <- "https://WIN-09USCP1J3QT:1338/v1/doc/002420fe-9858-4212-9da8-3ce00d5be660/hypercube/json"
  
  url <- paste("https://", host, ":", port, "/v1/doc/", app, "/hypercube/json", sep="")
  print( paste('url =', url) )
  
  r <- POST(url, body = toJSON(payload), encode = "json", config = httr::config(ssl_verifypeer = FALSE))
  d <- fromJSON(content(r, "text"))
  names(d) <- fields
  
 return(d)
}

library(jsonlite)
# HypeCube fields as JSON string, notice quote escaping
json <- fromJSON('["Date.autoCalendar.Date", "=Count( {$<[Case Is Closed] ={\'True\'} >} %CaseId )", "=Count( {$<[Status]={\'New\'} >} Distinct %CaseId )"]')

# HypeCube fields as list
# json <- c("Date.autoCalendar.Date", "=Count( {$<[Case Is Closed] ={'True'} >} %CaseId )", "=Count( {$<[Status]={'New'} >} Distinct %CaseId )")

d <- senser_data(host="WIN-09USCP1J3QT",port=1338,app="326fd5f7-a2fd-4dc3-9d41-3c80bb0e3198",payload=json,fields=c("Date", "Closed Cases", "New Cases"))

library(lubridate);
d$Date <- ymd_hms(d$Date)

d <- d[order(d$Date),]

library(plotly)
plot_ly(data = d, x = ~d$`Date`, y = ~d$`Closed Cases`, name = 'trace 0', type = 'scatter', mode = 'lines+markers')
plot_ly(data = d, x = d$`New Cases`, y = d$`Closed Cases`) 

