var INSTRUMENT = "XAU_USD_D";

//json data
var jsonMarketData;
var jsonPafiParameter;
//Instances
var marketData;
var paFiCanvas;
var snapShots = [];
var tradeRecords = [];
var tradeActions = [];
var markers = [];
var balance = 0;
//Constants
var MAGIC3 = 3;
var MARGIN_ROW = 2;
var MARGIN_YAXIS_LABEL = 30;
var BUTTON_SIZE = 26;
var MARGIN_TITLE_BAR = 50;
var MARGIN_XCELL = 4;
var MARGIN_YCELL = 2;
var PAFI_CELL_SIZE = 20;
var PAFI_COLUMN_NUM = 100; //tekitou
var MARGIN_RIGHT_COLUMN = 12;
var TRADE_FEE_RATE = 0.0002; //DMM FX
var INITIAL_DEPOSIT = 3; 
var X_LITTLE_MERGIN = 2;
var LOSSCUT_RATE = 0.1;
var FRAME_RATE = 30;
var MARKET_DATA_FILE = './'+INSTRUMENT+'.json';
var PAFI_PARAM_FILE = './PafiParameter_'+INSTRUMENT+'.json';
var POSITION_MAX = 999; //available positions
var POSITIONS = 3;
var TRADE_AMOUNT;
var TRADEYEAR;

//Iteration
var snapIterator = 0;
var aPressed = 0;
var aPressedChecker = 0;
var nPressed = 0;
var sPressed = 0;
var lPressed = 0;
var bPressed = 0;
var ePressed = 0;
var onePressed = 0;
var zeroPressed = 0;

//Sync
var arbitor = 0; //0: not used 1: used

//Graphic
var latestRectColumns = 0;
var labels_position_x = PAFI_CELL_SIZE*10;
var labels_position_y = MARGIN_TITLE_BAR*0.6;
var globalX = 0;
var globalY = 0;

//Debug 
var debug_updateColumnNum = 0;
var debug_updateFigureMatrix = 0;
var debug_writeMergedCells = 0;
var debug_writeRangeCells = 0;
var debug_copyLatestSnapShot = 0;
var debug_getLastRowNum = 0;
var debug_drawMatrix = 0;
var debug_snapShotID = 340;
var debug_writePosition = 0;
var debug_generateFirstSnapShot = 0;
var debug_snapIterator = 0;
var debug_exit = 1;
var debug_entry = 1;
var debug_LossCut = 0;

MarketData = function(){
  this.instrument;
  this.granularity;
  this.candles = [];
  this.boxSize;
  this.reversalAmount;
  this.instrument;
  this.granularity;
  this.maxPrice;
  this.minPrice;
  this.numOfRows;
  this.columnNum;

  };
  
MarketData.prototype.initParam = function(){
  this.instrument = jsonMarketData.instrument;
  this.granularity = jsonMarketData.granularity;
  this.candles = jsonMarketData.candles;
  this.boxSize = parseFloat(jsonPafiParameter.BoxSize);
  this.reversalAmount = parseFloat(jsonPafiParameter.ReversalAmount);
  this.maxPrice = 0;
  this.minPrice = 0;
  this.numOfRows = 0;
  this.columnNum = 0;
  this.makeScale();
};


MarketData.prototype.getRowNum = function(_price){
  var row = parseInt( (_price - this.minPrice) / this.boxSize );
  // console.log("getRowNum: rowNum="+row+", _price="+_price+", boxSize="+this.boxSize);
  return row;
}

MarketData.prototype.makeScale = function(){
    
    for(var i=0; i<this.candles.length; i++){
      if (this.maxPrice < parseFloat(this.candles[i].mid.h)){
        this.maxPrice = parseFloat(this.candles[i].mid.h);
      }
      if (this.minPrice == 0){
        this.minPrice = parseFloat(this.candles[i].mid.l);
      }
      else if (this.minPrice > parseFloat(this.candles[i].mid.l)){
        this.minPrice = parseFloat(this.candles[i].mid.l);
      }      
    }
    this.minPrice = this.boxSize * parseInt(this.minPrice/this.boxSize);
    this.maxPrice = this.boxSize * (parseInt(this.maxPrice/this.boxSize)+1);
    this.numOfRows = MARGIN_ROW + parseInt((this.maxPrice - this.minPrice)/this.boxSize);
    this.columnNum = parseInt((windowWidth-MARGIN_YAXIS_LABEL)/PAFI_CELL_SIZE);
}

MarketData.prototype.updateColumnNum = function(){
  if(debug_updateColumnNum){console.log("updateColumnNum");}
  if(debug_updateColumnNum){console.log(" shanpShots.length=",snapShots.length);}
  numOfColumn = snapShots[snapShots.length-1].figureMatrix.columns.length;
  if(debug_updateColumnNum){console.log(" numOfColumn = "+numOfColumn);}
  if(numOfColumn > this.columnNum){
    this.columnNum = numOfColumn;
  }
}

MarketData.prototype.getPrice = function(_row){ //Minimum Price of the Box
  // var price = parseFloat(_row * this.boxSize + parseFloat(this.minPrice) + this.boxSize/2);
  var price = parseFloat(_row * this.boxSize + parseFloat(this.minPrice));
  return price;
}

MarketData.prototype.timeLNDNtoTYO = function(_dateString){
  // In: YYYY-MM-DDTHH:MM:SS.00...00Z (London Server)
  // Out: YYYY-MM-DD:HH:MM (Tokyo +8 SummerTime)

  var yearMonth = _dateString.split('-'); // -> YYYY,MM,DDTHH...
  var date = yearMonth[2].split('T'); // -> DD,HH:MM:SS.00...
  var hourMin = date[1].split(':'); // -> HH,MM,SS.00...
  
  var dateYear = parseInt(yearMonth[0]);
  var dateMonth = parseInt(yearMonth[1]);
  var dateDay = parseInt(date[0]);
  var dateHour = parseInt(hourMin[0]);
  var dateMin = parseInt(hourMin[1]);

  var monthDays = [
    31, //Jan
    28, //Feb
    31, //Mar
    30, //Apl
    31, //May
    30, //Jun
    31, //Jul
    31, //Aug
    30, //Sep
    31, //Oct
    30, //Nov
    31  //Dec
  ];

  dateHour = dateHour + 8;
  if(dateHour > 24){
    dateHour = dateHour - 24;
    dateDay = dateDay +1;
    if(dateDay > monthDays[dateMonth-1]){
      dateDay = 1;
      dateMonth = dateMonth + 1;
    }
  }

  var newdateString = dateYear + '-' + ('0'+dateMonth).slice(-2) + '-' + ('0'+dateDay).slice(-2) + ' ' + ('0'+dateHour).slice(-2) + ':' + ('0'+dateMin).slice(-2) + ' TYO';
  return newdateString;
}


Marker = function(){
  this.figure = ""; // Line / Rect
  this.ID = 0;
  this.sx = 0;
  this.sy = 0;
  this.dx = 0;
  this.dy = 0;
  this.columns = 0;
  this.rownum = 0;
  this.lifetime = 300;
}

Marker.prototype.getRowCount = function(){
  var sRow = (this.sy - MARGIN_TITLE_BAR)/PAFI_CELL_SIZE;
  sRow = parseInt(sRow);
  var dRow = (this.dy - MARGIN_TITLE_BAR)/PAFI_CELL_SIZE;
  dRow = parseInt(dRow);
  var count = dRow - sRow -1;
  // console.log("RowCount = ",count);
  return count;
}

Marker.prototype.getRowID = function(_yaxis){
  var rowID = paFiCanvas.getRowID(_yaxis);
  return rowID;
}


Marker.prototype.getColumnCount = function(){
  var sColumn = paFiCanvas.getColumnID(this.sx);
  var dColumn = paFiCanvas.getColumnID(this.dx);
  var count = dColumn - sColumn -1;
  // console.log("ColumnCount = ",count);
  return count;
}

Marker.prototype.getColor = function(_figure){
  var mycolor;
  if(_figure == "Line"){
    mycolor = color(200,20,200);
  }
  else if(_figure == "Rect"){
    mycolor = color(20,200,200);
  }
  else{
    mycolor = color(250,200,200);
  }
  return mycolor;
}

Marker.prototype.drawMark = function(){
  stroke(this.getColor(this.figure));
  noFill();
  strokeWeight(2);

  if(this.figure == "Line"){
    //TBD
  }
  else if (this.figure == "Rect"){
    rect(this.sx,this.sy,
        (this.dx-this.sx),(this.dy-this.sy)
        );
    var rowID = this.getRowID(this.dy);
    var targetPriceRows = parseFloat(this.columns * MAGIC3*marketData.boxSize);
    textSize(15);
    strokeWeight(1);
    text("C:"+String(this.columns)+" R:"+String(this.rownum)+" T:"+String(targetPriceRows),this.sx,this.sy-10);
  }
  else if (this.figure == "Price"){
    var rowID = paFiCanvas.getRowID(this.sy);
    textSize(15);
    strokeWeight(1);
    text(marketData.getPrice(rowID)+" :"+String(rowID),this.sx+30,this.sy-10);
    line(this.sx,this.sy,this.sx+29,this.sy-9);
    // console.log(marketData.getPrice(rowID),rowID);
  }
  this.lifetime --;
}

// PaFi Canvas Class
PaFiCanvas = function(){
  this.height = PAFI_CELL_SIZE*marketData.numOfRows+MARGIN_TITLE_BAR;
  this.width = PAFI_CELL_SIZE*(marketData.columnNum+MARGIN_RIGHT_COLUMN)+MARGIN_YAXIS_LABEL;
  // console.log("PaFiCanvas: ",marketData.numOfRows,this.height);
  this.contAreaSx = 10;
  this.contAreaSy = 10;
  this.contAreaDx = 40;
  this.contAreaDy = 40;
}

PaFiCanvas.prototype.updateWidth = function(){
  console.log("updateWidth");
  this.width = PAFI_CELL_SIZE*(marketData.columnNum+MARGIN_RIGHT_COLUMN)+MARGIN_YAXIS_LABEL;
  // console.log(" this.width="+this.width);
}

// koko
PaFiCanvas.prototype.drawLatestDate = function(snapID){
if(snapID > marketData.candles.length-1){
    snapID = marketData.candles.length-1;
  }
  textSize(30);
  stroke(201,235,139);
  strokeWeight(1);
  fill(201,235,139);
  //text(snapShots[snapID].time, this.width*0.1, MARGIN_TITLE_BAR*1.6);
  text(marketData.timeLNDNtoTYO(snapShots[snapID].time), labels_position_x, labels_position_y+120);
}

PaFiCanvas.prototype.drawContinuousArea = function(){
  stroke(100,100,100);
  fill(100,100,100);
  rect(this.contAreaSx,this.contAreaSy,this.contAreaDx, this.contAreaDy);
}

PaFiCanvas.prototype.drawframe = function(){
  strokeWeight(1);
  var i,x1=0,x2=0,y1=0,y2=0;
  //rows
  for(var i=0; i<marketData.numOfRows; i++){
    var x1 = MARGIN_YAXIS_LABEL;
    var x2 = this.width;
    var y1 = MARGIN_TITLE_BAR + PAFI_CELL_SIZE*i;
    if((marketData.numOfRows-i-1)%10 == 0){
      stroke(150);
    }
    else{
      stroke(100);
    }
    line(x1,y1,x2,y1);
  }

  //columns
  for(i=0; i<marketData.columnNum+MARGIN_RIGHT_COLUMN; i++){
    y1 = MARGIN_TITLE_BAR;
    y2 = this.height;PAFI_CELL_SIZE*i;
    x1 = MARGIN_YAXIS_LABEL + PAFI_CELL_SIZE*i;
    if((i-1)%10 == 0){
      stroke(150);
    }
    else{
      stroke(100);
    }
    line(x1,y1,x1,y2);
  }

  this.drawTitleLabel();
};

PaFiCanvas.prototype.drawTitleLabel = function(){

  //Title
  // koko
  textSize(30);
  stroke(101,215,239);
  strokeWeight(1);
  fill(101,215,239);
  text(marketData.instrument, labels_position_x, labels_position_y);
  text(marketData.granularity, labels_position_x+300, labels_position_y);
  textSize(20);
  text("BoxSize = "+marketData.boxSize, labels_position_x+20, labels_position_y+30);


  //Start and End date
  textSize(17);
  text(marketData.timeLNDNtoTYO(marketData.candles[0].time), labels_position_x+20, labels_position_y+50);
  text(marketData.timeLNDNtoTYO(marketData.candles[marketData.candles.length-1].time), labels_position_x+20, labels_position_y+70);
};


PaFiCanvas.prototype.drawMatrix = function(snapID){
  var blue = color(104,216,239,255);

  var pink = color(225,32,103,225);
  var green = color(109,149,32,225);
  var purple = color(172,128,255);
  textSize(10);

  if(snapID > marketData.candles.length-1){
    snapID = marketData.candles.length-1;
  }

  var latestFigureMatrix = snapShots[snapID].figureMatrix;
  for(var column=0; column < latestFigureMatrix.columns.length; column++){
    for(var row=0; row < marketData.numOfRows; row++){
      // symbol
      stroke(blue);
      fill(blue);

      // strokeWeight(1);

      var symbol = latestFigureMatrix.columns[column].cellss[row].symbol;
      text(symbol, this.getCanvasXaxis(column),this.getCanvasTextYaxis(row));
      if(debug_drawMatrix){if(column==93 && symbol != ""){console.log(column,row,symbol);}}
      // sign
      var comment = latestFigureMatrix.columns[column].cellss[row].comment;
      if(comment.match("Entry")){
      // if(comment == "Entry"){
        stroke(pink);
        fill(pink);
        // rect(this.getCanvasXaxis(column)-X_LITTLE_MERGIN,this.getCanvasYaxis(row),PAFI_CELL_SIZE/2,PAFI_CELL_SIZE);
      }
      if(comment.match("Exit")){
      // else if(comment == "Exit"){
        stroke(green);
        fill(green);
        // arc(this.getCanvasXaxis(column)+PAFI_CELL_SIZE/2,this.getCanvasYaxis(row)-PAFI_CELL_SIZE/2,PAFI_CELL_SIZE,PAFI_CELL_SIZE,
        //   0, PI + QUARTER_PI);
        // rect(this.getCanvasXaxis(column)+PAFI_CELL_SIZE/2-X_LITTLE_MERGIN,this.getCanvasYaxis(row),PAFI_CELL_SIZE/2,PAFI_CELL_SIZE);
      }
      if(comment.match("LossCut")){
      // else if(comment == "Exit"){
        stroke(purple);
        fill(purple);
        arc(
          this.getCanvasXaxis(column)+X_LITTLE_MERGIN+PAFI_CELL_SIZE/4,
          this.getCanvasYaxis(row)+PAFI_CELL_SIZE/2,
          PAFI_CELL_SIZE,
          PAFI_CELL_SIZE,
          0, 
          PI + QUARTER_PI);
        // rect(this.getCanvasXaxis(column)+PAFI_CELL_SIZE/2-X_LITTLE_MERGIN,this.getCanvasYaxis(row),PAFI_CELL_SIZE/2,PAFI_CELL_SIZE);
      }

    }
  }

};

PaFiCanvas.prototype.copyPosition = function(snapID){
  if(snapID>0){
    for(i=0;i<snapShots[snapID].figureMatrix.tradeBuyPosition.length;i++){
      var position = snapShots[snapID].figureMatrix.tradeBuyPosition[i];
      var previousPosition = snapShots[snapID-1].figureMatrix.tradeBuyPosition[i];
      this.copyPotisionContents(previousPosition, position);      
    }
    for(i=0;i<snapShots[snapID].figureMatrix.tradeSellPosition.length;i++){
      var position = snapShots[snapID].figureMatrix.tradeSellPosition[i];
      var previousPosition = snapShots[snapID-1].figureMatrix.tradeSellPosition[i];
      this.copyPotisionContents(previousPosition, position);
    }
  }
}

PaFiCanvas.prototype.copyPotisionContents = function(from, to){
  to.status=from.status;
  to.bs=from.bs;
  to.date=from.date;
  to.columnID=from.columnID;
  to.row=from.row;
  to.amount=from.amount;
  to.price=from.price;
  to.priceObj=from.priceObj;
  to.recordID=from.recordID;

}

PaFiCanvas.prototype.drawSigns = function(snapID){
  var colorBuyEntry = color(255,0,0);
  var colorBuyExit = color(255,192,203);
  var colorBuyLossCut = color(186,85,211);
  var colorSellEntry = color(0,255,0);
  var colorSellExit = color(208,233,157);
  var colorSellLossCut = color(28,211,209);
  strokeWeight(1);
  textSize(10);

  var i=tradeRecords.length-1;
  while(i>0){
    var record = tradeRecords[i];
    //Entry
    var row = record.entryRow;
    var column = record.entryColumnID;
    var xAxis;
    var yAxis;
    if(record.bs == "Buy"){
      stroke(colorBuyEntry);
      fill(colorBuyEntry);
      xAxis = this.getCanvasXaxis(column)-X_LITTLE_MERGIN;
      yAxis = this.getCanvasYaxis(row);
      rect(xAxis,yAxis,PAFI_CELL_SIZE/2.5,PAFI_CELL_SIZE/2.5);      
    }
    else if(record.bs == "Sell"){
      stroke(colorSellEntry);
      fill(colorSellEntry);
      xAxis = this.getCanvasXaxis(column)-X_LITTLE_MERGIN+PAFI_CELL_SIZE/2;
      yAxis = this.getCanvasYaxis(row);
      rect(xAxis,yAxis,PAFI_CELL_SIZE/2.5,PAFI_CELL_SIZE/2.5);      
    }
    else{
      console.log("Unexpedted value in drawSigns!");
    }


    //Exit
    if(record.exitDate != ""){
      var row = record.exitRow;
      var column = record.exitColumnID;
      var xAxis;
      var yAxis;
      if(record.bs == "Buy"){
        if(record.losscut == "Yes"){
          stroke(colorBuyLossCut);
          fill(colorBuyLossCut);
        }
        else{
          stroke(colorBuyExit);
          fill(colorBuyExit);
        }
        xAxis = this.getCanvasXaxis(column)-X_LITTLE_MERGIN;
        yAxis = this.getCanvasYaxis(row)+PAFI_CELL_SIZE/2;
        rect(xAxis,yAxis,PAFI_CELL_SIZE/2.5,PAFI_CELL_SIZE/2.5);
      }
      else if(record.bs == "Sell"){
        if(record.losscut == "Yes"){
          stroke(colorSellLossCut);
          fill(colorSellLossCut);
        }
        else{
          stroke(colorSellExit);
          fill(colorSellExit);          
        }
        xAxis = this.getCanvasXaxis(column)-X_LITTLE_MERGIN+PAFI_CELL_SIZE/2;
        yAxis = this.getCanvasYaxis(row)+PAFI_CELL_SIZE/2;
        rect(xAxis,yAxis,PAFI_CELL_SIZE/2.5,PAFI_CELL_SIZE/2.5);      
      }
    }
    i--;
  }
}

PaFiCanvas.prototype.getCanvasXaxis = function(_column){
  return MARGIN_YAXIS_LABEL + PAFI_CELL_SIZE * _column + MARGIN_XCELL;
};

PaFiCanvas.prototype.getCanvasYaxis = function(_row){
  return  MARGIN_TITLE_BAR + PAFI_CELL_SIZE*(marketData.numOfRows - _row - 1);
};

PaFiCanvas.prototype.getCanvasTextYaxis = function(_row){
  return  MARGIN_TITLE_BAR + PAFI_CELL_SIZE*(marketData.numOfRows - _row);
};

// PaFiCanvas.prototype.getRowNum = function(_yaxis){
//   var row = marketData.numOfRows - ((_yaxis - MARGIN_TITLE_BAR)/PAFI_CELL_SIZE);
//   return parseInt(row);
// }

PaFiCanvas.prototype.getRowID = function(_yaxis){
  var row = marketData.numOfRows - ((_yaxis - MARGIN_TITLE_BAR)/PAFI_CELL_SIZE);
  return parseInt(row);
}


PaFiCanvas.prototype.getColumnID = function(_xaxis){
  var columnID = parseInt((_xaxis - MARGIN_YAXIS_LABEL)/PAFI_CELL_SIZE);
  return columnID;
}

// Trade Position Class
TradePosition = function(){
  this.status= ""; //Open or null
  this.bs="";
  this.date="";
  this.columnID=0;
  this.row=0;
  this.amount=0;
  this.price=0;
  this.priceObj=0;
  this.recordID=0;
}

TradePosition.prototype.writePosition = function( 
  _date,
  _columnID,
  _row,
  _bs,
  _amount,
  _price,
  _priceObj,
  _status){

  this.status = _status;
  this.bs = _bs;
  this.date = _date;
  this.columnID = _columnID;
  this.row = _row;
  this.amount = _amount;
  this.price = _price;
  this.priceObj = _priceObj;
  if(debug_writePosition){console.log("writePosition. ",_status, _bs, _date, _columnID, _row, _amount, _price,_priceObj);}
}

TradePosition.prototype.copyPosition = function( _status, _bs, _date, _columnID, _row, _amount, _price, _priceObj,_recordID){
  this.status = _status;
  this.bs = _bs;
  this.date = _date;
  this.columnID = _columnID;
  this.row = _row;
  this.amount = _amount;
  this.price = _price;
  this.priceObj = _priceObj;
  this.recordID = _recordID;
}

TradePosition.prototype.entry = function(_sign, _time, _columnID, _row, _price, _priceObj){
    //update position
  this.writePosition(
    _time,
    _columnID, 
    _row,
    _sign,
    TRADE_AMOUNT/POSITIONS, 
    _price,
    _priceObj,
    "Open");

  //generate record
  var newRecord = new TradeRecord();
  newRecord.pair = marketData.instrument;
  newRecord.bs = _sign;
  newRecord.entrydate = _time;
  newRecord.entryPrice = _price;
  newRecord.amount = TRADE_AMOUNT/POSITIONS;
  newRecord.exitDate = "";
  newRecord.exitPrice = 0;
  newRecord.fee = _price * TRADE_AMOUNT/POSITIONS * TRADE_FEE_RATE;
  newRecord.profitLoss = 0;
  // newRecord.balance = tradeRecords[tradeRecords.length-1].balance;
  newRecord.entryRow = _row;
  newRecord.entryColumnID = _columnID;

  tradeRecords.push(newRecord);
  if(debug_entry){console.log("ENTRY ",_sign,_time,_columnID,_row,_price,_priceObj);}

  this.recordID = tradeRecords.length-1;
}


TradePosition.prototype.exit = function(
  _sign, _time, _columnID, _row, _price,_priceObj){

  this.writePosition(
    _time,
    _columnID, 
    _row,
    _sign,
    TRADE_AMOUNT/POSITIONS, 
    _price,
    _priceObj,
    "");


  // var record = tradeRecords[tradeRecords.length-1];
  var record = tradeRecords[this.recordID];
  record.exitDate = _time;
  if(record.bs != _sign){ 
    console.log("Unexpected Operation in TradePosition:exit.");
    return;
  }
  record.exitPrice = _price;
  record.fee = record.fee + _price * TRADE_AMOUNT/POSITIONS * TRADE_FEE_RATE;
  if(_sign == "Buy"){

    record.profitLoss = (record.exitPrice - record.entryPrice) * TRADE_AMOUNT/POSITIONS * (1 - TRADE_FEE_RATE);
  }
  else{
    record.profitLoss = (record.entryPrice - record.exitPrice) * TRADE_AMOUNT/POSITIONS * (1 - TRADE_FEE_RATE);


  }
  balance = balance +  record.profitLoss - record.fee;
  record.balance = balance;
  record.exitColumnID = _columnID;
  record.exitRow = _row;

  
  if(debug_exit){console.log("EXIT ",record.balance,record.profitLoss,_sign,_time,_columnID,_row,_price);}

  this.recordID = 0;

}

TradeAction = function(){
  this.mouseX = 0;
  this.mouseY = 0;
  this.row = 0;
  this.column = 0;
  this.action = "";
}

TradeAction.prototype.initParam = function(_mouseX, _mouseY, _action){
  this.mouseX = _mouseX;
  this.mouseY = _mouseY;
  this.row = paFiCanvas.getRowID(_mouseY);
  this.column = paFiCanvas.getColumnID(_mouseX);
  this.action = _action;
}

//Trade Record Class
TradeRecord = function (){
  // this.status = ""; //null or OPEN
  this.pair = "";
  this.bs = "";
  this.entrydate = "";
  this.entryPrice = 0;
  this.amount = 0;
  this.exitDate = "";
  this.exitPrice = 0;
  this.fee = 0;
  this.balance = 0;
  this.profitLoss = 0;
  this.entryRow = 0;
  this.entryColumnID = 0;
  this.exitColumnID = 0;
  this.exitRow = 0;
  // this.losscut = "No";

}

// SanpShots Class
FigureCell = function(){
  this.symbol = "";
  this.comment = "";
};

FigureColumn = function(){
  this.cellss = [];
}

FigureMatrix = function(){
  this.columns = [];
  this.tradeBuyPosition = [];
  this.tradeSellPosition = [];
};
FigureMatrix.prototype.getVacantPosisionID = function(_bs){
  var positionID=POSITION_MAX;
  var position;
  if(_bs == "Buy"){
    for(var i=0;i<this.tradeBuyPosition.length;i++){
      if(this.tradeBuyPosition[i].status == ""){
        positionID = i;
        break;
      }
    }
  }
  else{
    for(var i=0;i<this.tradeSellPosition.length;i++){
      if(this.tradeSellPosition[i].status == ""){
        positionID = i;
        break;
      }
    }
  }
  return positionID; // POSITION_MAX if all positions already used
}


SnapShot = function(_date){
  this.time = _date;
  // this.priceChange = "Default";
  this.trend = "Default";
  this.figureMatrix;

};


SnapShot.prototype.generateFirstSnapShot = function(){
  if(debug_generateFirstSnapShot){console.log("generateFirstSnapShot started.");}
  var newFigureMatrix = new FigureMatrix();
  var newColumn = this.generateNewColumn();

  //set default value
  var newPrice = parseFloat(marketData.candles[0].mid.c);
  var newPriceRowNum = marketData.getRowNum(newPrice);
  newColumn.cellss[newPriceRowNum].symbol = "X";
  newColumn.cellss[newPriceRowNum].comment = "FirstData";

  newFigureMatrix.columns.push(newColumn);

  this.figureMatrix = newFigureMatrix;
  for(var i=0;i<POSITIONS;i++){
    var newBuyPosition = new TradePosition("Buy");
    var newSellPosition = new TradePosition("Sell");
    this.figureMatrix.tradeBuyPosition.push(newBuyPosition);
    this.figureMatrix.tradeSellPosition.push(newSellPosition);    
  }
  this.trend = "Up";

  if(debug_generateFirstSnapShot){
    console.log(this);
    console.log("generateFirstSnapShot done.");
  }

};


SnapShot.prototype.copyLatestSnapShot = function(){
  var newFigureMatrix = new FigureMatrix();

  var lastSnapShotID = snapShots.length-1;
  if(debug_copyLatestSnapShot){console.log("copyLatestSnapShot started.");}
  if(debug_copyLatestSnapShot){console.log(lastSnapShotID);}
  if(debug_copyLatestSnapShot){console.log(snapShots[lastSnapShotID]);}
  var columnLength = snapShots[lastSnapShotID].figureMatrix.columns.length;
  // console.log("columnLength="+columnLength);
  var i=0;
  for(var i=0; i<columnLength; i++){
    var newColumn = new FigureColumn();
    for(var j=0; j<marketData.numOfRows; j++){
      var newCell = new FigureCell();
      newCell.symbol = 
        snapShots[lastSnapShotID].figureMatrix.columns[i].cellss[j].symbol;
      newCell.comment = 
        snapShots[lastSnapShotID].figureMatrix.columns[i].cellss[j].comment;
      newColumn.cellss.push(newCell);
    }    
    newFigureMatrix.columns.push(newColumn);
  }
  for(var i=0;i<POSITIONS;i++){
    var newBuyPosition = new TradePosition("Buy");
    newBuyPosition.copyPosition(
      snapShots[lastSnapShotID].figureMatrix.tradeBuyPosition[i].status,
      snapShots[lastSnapShotID].figureMatrix.tradeBuyPosition[i].bs,
      snapShots[lastSnapShotID].figureMatrix.tradeBuyPosition[i].date,
      snapShots[lastSnapShotID].figureMatrix.tradeBuyPosition[i].columnID,
      snapShots[lastSnapShotID].figureMatrix.tradeBuyPosition[i].row,
      snapShots[lastSnapShotID].figureMatrix.tradeBuyPosition[i].amount,
      snapShots[lastSnapShotID].figureMatrix.tradeBuyPosition[i].price,
      snapShots[lastSnapShotID].figureMatrix.tradeBuyPosition[i].priceObj,
      snapShots[lastSnapShotID].figureMatrix.tradeBuyPosition[i].recordID
      );

    var newSellPosition = new TradePosition("Sell");
    newSellPosition.copyPosition(
      snapShots[lastSnapShotID].figureMatrix.tradeSellPosition[i].status,
      snapShots[lastSnapShotID].figureMatrix.tradeSellPosition[i].bs,
      snapShots[lastSnapShotID].figureMatrix.tradeSellPosition[i].date,
      snapShots[lastSnapShotID].figureMatrix.tradeSellPosition[i].columnID,
      snapShots[lastSnapShotID].figureMatrix.tradeSellPosition[i].row,
      snapShots[lastSnapShotID].figureMatrix.tradeSellPosition[i].amount,
      snapShots[lastSnapShotID].figureMatrix.tradeSellPosition[i].price,
      snapShots[lastSnapShotID].figureMatrix.tradeSellPosition[i].priceObj,
      snapShots[lastSnapShotID].figureMatrix.tradeSellPosition[i].recordID
      );

    newFigureMatrix.tradeBuyPosition.push(newBuyPosition);
    newFigureMatrix.tradeSellPosition.push(newSellPosition);
  }

  this.figureMatrix = newFigureMatrix;


  this.trend = snapShots[lastSnapShotID].trend;

  if(debug_copyLatestSnapShot){console.log(this);}
};

SnapShot.prototype.getLastRowNum = function(_columnID){
  var row = 0;
  var lastColumn = this.figureMatrix.columns[_columnID];
  if(this.figureMatrix.columns[_columnID].cellss[0].symbol == "O"){
    row = 0;
  }
  else if(lastColumn.cellss[marketData.numOfRows-1].symbol == "X"){
    row = marketData.numOfRows-1;
  }
  else{
    for(var i=0; i<marketData.numOfRows-1; i++){
      if(lastColumn.cellss[i].symbol == "X" && lastColumn.cellss[i+1].symbol ==""){
        row = i;
        break;
      }
      if(lastColumn.cellss[i].symbol == "" && lastColumn.cellss[i+1].symbol =="O"){
        row = i+1;
        break;
      }
    }
  }
  if(debug_getLastRowNum){console.log("     getLastRowNum done. column = "+lastColumnID+", row="+row);}
  return row;  
}

SnapShot.prototype.updateFigureMatrix = function(_latestCandle){
  if(_latestCandle <= debug_snapShotID){
    if(debug_updateFigureMatrix){console.log(_latestCandle+":updateFigureMatrix started.");}
  }
  //detect price change
  var lastPrice = parseFloat(marketData.candles[_latestCandle-1].mid.c);
  var newPrice = parseFloat(marketData.candles[_latestCandle].mid.c);

  var lastColumnID = this.figureMatrix.columns.length-1;
  var lastPriceRowNum = this.getLastRowNum(lastColumnID);
  // var lastPriceRowNum = marketData.getRowNum(lastPrice);
  var newPriceRowNum = marketData.getRowNum(newPrice);
  if(_latestCandle <= debug_snapShotID){
    if(debug_updateFigureMatrix){console.log("  lastPriceRowNum="+lastPriceRowNum);  }
    if(debug_updateFigureMatrix){console.log("  newPriceRowNum="+newPriceRowNum);}
  }
  var priceChange;
  if(lastPriceRowNum > newPriceRowNum){
    priceChange = "Down";
  }
  else if (lastPriceRowNum < newPriceRowNum){
    priceChange = "Up";
  }
  else{
    priceChange = "Keep";
  }

  //judge trend
  var lastTrend = this.trend;
  if (lastTrend == "Up"){
    if(priceChange == "Up"){
      //1.
      if(_latestCandle <= debug_snapShotID){
        if(debug_updateFigureMatrix){console.log("trend:Up priceChange:Up");    }
      }
      this.writeMergedCell(this.figureMatrix.columns.length-1, newPriceRowNum, "X", "");
    }
    else if(priceChange == "Down"){
      //2.
    if(_latestCandle == debug_snapShotID){
      if(debug_updateFigureMatrix){console.log("  trend:Up priceChange:Down"); }
    }
      if ((lastPriceRowNum - newPriceRowNum) >= marketData.reversalAmount){
        //trend changed
        if(_latestCandle == debug_snapShotID){
          if(debug_updateFigureMatrix){console.log("  trend change to Down.");}
        }
        var newColumn = this.generateNewColumn();
        this.figureMatrix.columns.push(newColumn);
        this.writeRangeCells(this.figureMatrix.columns.length-1, lastPriceRowNum-1, newPriceRowNum, "O");

        var newColumnID = this.figureMatrix.columns.length-1;
        // this.figureMatrix.columns[newColumnID].cellss[lastPriceRowNum].comment = marketData.candles[_latestCandle].time;
        this.trend = "Down";
      }
      else{
        //do nothing
      }
    }
    else if(priceChange == "Keep"){
      if(_latestCandle <= debug_snapShotID){
        if(debug_updateFigureMatrix){console.log("trend:Up priceChange:Keep"); }
      }
      //3. do nothing      
    }
  }
  else if (lastTrend == "Down"){
    if(priceChange == "Up"){
    if(_latestCandle <= debug_snapShotID){
      if(debug_updateFigureMatrix){console.log("trend:Down priceChange:Up"); }
    }
      //4.
      if (( newPriceRowNum - lastPriceRowNum) >= marketData.reversalAmount){
        //trend changed
        if(_latestCandle <= debug_snapShotID){
          if(debug_updateFigureMatrix){console.log("  trend change to Up.");}
        }
        var newColumn = this.generateNewColumn();
        this.figureMatrix.columns.push(newColumn);
        this.writeRangeCells(this.figureMatrix.columns.length-1,lastPriceRowNum+1, newPriceRowNum, "X");
        var newColumnNum = this.figureMatrix.columns.length-1;
        // this.figureMatrix.columns[newColumnNum].cellss[lastPriceRowNum].comment = marketData.candles[_latestCandle].time;
        this.trend = "Up";
      }
    }
    else if(priceChange == "Down"){
      if(_latestCandle <= debug_snapShotID){
        if(debug_updateFigureMatrix){console.log("trend:Down priceChange:Down");}
      }
      //5. 
      //add symbol
      this.writeMergedCell(this.figureMatrix.columns.length-1,newPriceRowNum, "O", "");
    }
    else if(priceChange == "Keep"){
      if(_latestCandle <= debug_snapShotID){
        if(debug_updateFigureMatrix){console.log("trend:Down priceChange:Keep");}
      }
      //6. do nothing      
    }
  }
  else {
    if(debug_updateFigureMatrix){console.log("Unexpected trend data "+lastTrend+" in updateFigureMatrix in snapshot "+this.time);}
  }

  if(_latestCandle <= debug_snapShotID){
    if(debug_updateFigureMatrix){console.log("lastTrend="+lastTrend+",priceChange="+priceChange+",newTrend="+this.trend);}
    if(debug_updateFigureMatrix){console.log("latestColumnID ="+(this.figureMatrix.columns.length-1));}
  }

}

SnapShot.prototype.generateNewColumn = function(){
  var newColumn = new FigureColumn();
  for(var i=0; i<marketData.numOfRows; i++){
    var newCell = new FigureCell();
    newColumn.cellss.push(newCell);
  }

  return newColumn;

}

SnapShot.prototype.generateLatestSnapShot = function(_latestCandle){
  //copy
  this.copyLatestSnapShot();
  //update
  this.updateFigureMatrix(_latestCandle);
  //trade
  if(snapShots[snapShots.length-1].figureMatrix.columns.length >2){
    this.trade(_latestCandle);
  }

}

SnapShot.prototype.writeRangeCells = function(_column, _fromRow, _toRow, _symbol){
  if(debug_writeRangeCells){console.log("    writeRangeCells started with parameters:");}
  if(debug_writeRangeCells){console.log("    "+_column, _fromRow, _toRow, _symbol);}

  // var lastColumn = this.figureMatrix.columns.length-1;
  if(_fromRow < _toRow){
    for(var i=_fromRow; i<=_toRow; i++){
      this.figureMatrix.columns[_column].cellss[i].symbol = _symbol;
    }
  }
  else{
    for(var i=_toRow; i<=_fromRow; i++){
      this.figureMatrix.columns[_column].cellss[i].symbol = _symbol;
    }
  }
}



SnapShot.prototype.writeMergedCell = function(_column, _row, _symbol){
  if(debug_writeMergedCells){console.log("    writeMergedCell started.");}
  if(debug_writeMergedCells){console.log("    "+_column,_row,_symbol);}

  //search edge symbol 
  // var lastColumn = this.figureMatrix.columns.length-1;
  var lowerEdge = 0;
  var higherEdge = 0;
  for(var i=0; i<marketData.numOfRows-1; i++){
    if(this.figureMatrix.columns[_column].cellss[i].symbol=="" 
        && 
       this.figureMatrix.columns[_column].cellss[i+1].symbol!=""){
      lowerEdge = i+1;
    }
    if(this.figureMatrix.columns[_column].cellss[i].symbol!=""
        &&
        this.figureMatrix.columns[_column].cellss[i+1].symbol==""){
      higherEdge = i;
    }
  }
  if(debug_writeMergedCells){console.log("lowerEdge="+lowerEdge+", higherEdge="+higherEdge);}

  //write Symbol
  if(_symbol=="X"){
    //from lower edge to _row
    for(var i=lowerEdge; i<_row+1; i++){
      this.figureMatrix.columns[_column].cellss[i].symbol = "X";
    }
  }
  else if(_symbol=="O"){
    //from higher edge to _row
    for(var i=higherEdge; i>_row-1; i--){
      this.figureMatrix.columns[_column].cellss[i].symbol = "O";
    }
  }
  else{
    //do nothing
    console.log("unexpedted _symbol in writeMergedCell: "+_symbol);
  }

  // console.log("writeMergedCell done.");

}

SnapShot.prototype.trade = function(_latestCandle){

  // If columns new, cancel opposite entry orders 
  if(this.figureMatrix.columns.length > 
    snapShots[_latestCandle-1].figureMatrix.columns.length){
      var i=tradeActions.length-1;
      while(i>=0){
        if(tradeActions[i].action == "BuyEntry" && this.trend == "Down"){
          tradeActions.splice(i,1);
        }
        else if(tradeActions[i].action == "SellEntry" && this.trend == "Up"){
          tradeActions.splice(i,1);
        }
        i--;
      }
    }

/*
  if(this.figureMatrix.columns.length > 
    snapShots[_latestCandle-1].figureMatrix.columns.length){
    var i=tradeActions.length-1;
    while(i>=0){
      tradeActions.splice(i,1);
      i--;
    }
  }
*/
  var columnID = this.figureMatrix.columns.length-1;
  var highPrice = parseFloat(marketData.candles[_latestCandle].mid.h);
  var lowPrice = parseFloat(marketData.candles[_latestCandle].mid.l);
  var closePrice = parseFloat(marketData.candles[_latestCandle].mid.c);

  ////Exit
  for(var i=0;i<this.figureMatrix.tradeBuyPosition.length;i++){
    if(this.figureMatrix.tradeBuyPosition[i].status == "Open"){      
      if(this.figureMatrix.tradeBuyPosition[i].columnID == columnID){
        if(this.figureMatrix.tradeBuyPosition[i].priceObj < highPrice){
          //profit taking
          this.figureMatrix.tradeBuyPosition[i].exit(
            "Buy",
            this.time, 
            columnID, 
            marketData.getRowNum(this.figureMatrix.tradeBuyPosition[i].priceObj),
            this.figureMatrix.tradeBuyPosition[i].priceObj,
            this.figureMatrix.tradeBuyPosition[i].priceObj);
        }
      }
      else{
        //Loss Cut by new column
        this.figureMatrix.tradeBuyPosition[i].exit(
          "Buy",
          this.time, 
          columnID,
          this.getLastRowNum(columnID),
          closePrice, 
          closePrice);
        }
      }
    }

  for(var i=0;i<this.figureMatrix.tradeSellPosition.length;i++){
    if(this.figureMatrix.tradeSellPosition[i].status == "Open"){      
      if(this.figureMatrix.tradeSellPosition[i].columnID == columnID ){
        if(this.figureMatrix.tradeSellPosition[i].priceObj > lowPrice){
          //profit taking
          this.figureMatrix.tradeSellPosition[i].exit(
            "Sell",
            this.time, 
            columnID, 
            marketData.getRowNum(this.figureMatrix.tradeSellPosition[i].priceObj),
            this.figureMatrix.tradeSellPosition[i].priceObj, 
            this.figureMatrix.tradeSellPosition[i].priceObj);
        }
      }
      else{
        //Loss Cut
        this.figureMatrix.tradeSellPosition[i].exit(
          "Sell",
          this.time, 
          columnID,
          this.getLastRowNum(columnID),
          closePrice, 
          closePrice); 
      }    
    }
  }


  //// Entry
  var ratio = [0.5,0.7,1.0];
  var i=0;
  while(i<=tradeActions.length-1){
    var mouseRow = paFiCanvas.getRowID(tradeActions[i].mouseY);
    var mousePrice = marketData.getPrice(mouseRow);
    var priceObjRaws = latestRectColumns * MAGIC3;

    if(mousePrice < highPrice && tradeActions[i].action =="BuyEntry"){
      for(var j=0;j<3;j++){
        var priceObj = (mousePrice - marketData.boxSize) + priceObjRaws*parseFloat(marketData.boxSize)*ratio[j];
        this.figureMatrix.tradeBuyPosition[j].entry(
          "Buy",this.time, columnID, mouseRow, mousePrice,priceObj);
      }
      tradeActions[i].action ="";
    }
    else if(mousePrice > lowPrice && tradeActions[i].action =="SellEntry"){
      for(var j=0;j<3;j++){
        var priceObj = (mousePrice + marketData.boxSize) - priceObjRaws*parseFloat(marketData.boxSize)*ratio[j];
        this.figureMatrix.tradeSellPosition[j].entry(
          "Sell",this.time, columnID, mouseRow, mousePrice,priceObj);          
      }
      tradeActions[i].action ="";
    }

    i++;
  }
  // delete finished action
  var i=tradeActions.length-1;
  while(i>=0){
  // for(var i=tradeActions.length-1; i>=0; i--){
    if(tradeActions[i].action == ""){
      tradeActions.splice(i,1);
    }
    i--;
  }
}


TradeSign = function(){
  this.sign="";
  this.row=0;
  this.previousRow=0;
}

function saveTradeRecords(){
  var table = new p5.Table();
  table.addColumn('id');
  table.addColumn('pair');
  table.addColumn('bs');
  table.addColumn('amount');
  table.addColumn('entrydate');
  table.addColumn('entryPrice');
  table.addColumn('exitDate');
  table.addColumn('exitPrice');
  table.addColumn('fee');
  table.addColumn('profitLoss');
  table.addColumn('balance');
  table.addColumn('entryRow');
  table.addColumn('entryColumnID');
  table.addColumn('exitRow');
  table.addColumn('exitColumnID');

  for(var i=0;i<tradeRecords.length;i++){
    var newRow = table.addRow();
    newRow.setNum('id',table.getRowCount()-1);
    newRow.setString('pair',tradeRecords[i].pair);
    newRow.setString('bs',tradeRecords[i].bs);
    newRow.setNum('amount',tradeRecords[i].amount);
    newRow.setString('entrydate',tradeRecords[i].entrydate);
    newRow.setNum('entryPrice',tradeRecords[i].entryPrice);
    newRow.setString('exitDate',tradeRecords[i].exitDate);
    newRow.setNum('exitPrice',tradeRecords[i].exitPrice); 
    newRow.setNum('fee',tradeRecords[i].fee);
    newRow.setNum('profitLoss',tradeRecords[i].profitLoss);
    newRow.setNum('balance',tradeRecords[i].balance);
    newRow.setNum('entryRow',tradeRecords[i].entryRow);
    newRow.setNum('entryColumnID',tradeRecords[i].entryColumnID);
    newRow.setNum('entryRow',tradeRecords[i].entryRow);
    newRow.setNum('exitRow',tradeRecords[i].exitRow);
    newRow.setNum('exitColumnID',tradeRecords[i].exitColumnID);
  }
  var fileName = INSTRUMENT+'.csv';
  saveTable(table,fileName, 'csv');  
}

function mousePressed(){
  // background(100,10,90); //refresh
  sx = mouseX;
  sy = mouseY;
  dx = sx;
  dy = sy;
  globalX = mouseX;
  globalY = mouseY;
  // console.log("mousePressed: ",sx,sy);
  return false;
}

function mouseDragged() {
  // background(100,10,90); //refresh
  stroke(255);
  noFill();
  strokeWeight(2);
  dx = mouseX;
  dy = mouseY;
  var w = dx-sx;
  var h = dy-sy;
  rect(sx,sy,w,h);
  // console.log("mouseDragged: ",dx,dy);

  // prevent default
  return false;
}

function mouseReleased() {
  stroke(255);
  noFill();
  strokeWeight(2);
  var w = dx-sx;
  var h = dy-sy;
  rect(sx,sy,w,h);
  if(sx != dx && sy != dy){
    var newMarker = new Marker();
    newMarker.figure = "Rect";
    newMarker.ID = markers.length;
    newMarker.sx = sx;
    newMarker.sy = sy;
    newMarker.dx = dx;    
    newMarker.dy = dy;
    newMarker.columns = newMarker.getColumnCount();
    newMarker.rownum = newMarker.getRowCount();

    markers.push(newMarker);

    latestRectColumns = newMarker.columns;
  }
  // prevent default
  return false;
}



//Main
function preload(){
  jsonPafiParameter = loadJSON(PAFI_PARAM_FILE);
  jsonMarketData = loadJSON(MARKET_DATA_FILE);
}

function setup() { 

  console.log("Start PaFi!");  
  sx=0;
  sy=0;
  dx=0;
  dy=0;

  INITIAL_DEPOSIT = parseInt(jsonPafiParameter.InitialDeposit); 
  TRADE_AMOUNT = parseInt(jsonPafiParameter.Amount);


  //Generate Market Data
  marketData = new MarketData();
  marketData.initParam();
  console.log(marketData);

  var str1 = marketData.candles[marketData.candles.length-1].time;
  var str2 = str1.split('-');
  TRADEYEAR = str2[0];


  //Generate TradeRecord
  balance = parseInt(INITIAL_DEPOSIT);
  var newRecord = new TradeRecord();
  newRecord.balance = balance;
  tradeRecords.push(newRecord);

  //FigureMatrix
  var snapshot = new SnapShot(marketData.candles[0].time);
  snapshot.generateFirstSnapShot();
  snapShots.push(snapshot);

  for(var i=1; i<marketData.candles.length; i++){
    var snapshot = new SnapShot(marketData.candles[i].time);
    snapshot.generateLatestSnapShot(i);
    snapShots.push(snapshot);
  }

  console.log(snapShots);

  //Generate PaFi Canvas
  paFiCanvas = new PaFiCanvas();
  marketData.updateColumnNum();
  paFiCanvas.updateWidth();

  createCanvas(paFiCanvas.width, paFiCanvas.height); 
  background(10,10,10);
  frameRate(FRAME_RATE);

}

function draw() {
  if(snapIterator < marketData.candles.length){
    background(10,10,10);
  }


  //frame
  paFiCanvas.drawframe();


  //aPressed continuous area
  paFiCanvas.drawContinuousArea();

  arbitor = 1;
  //Mark
  for(var i=0; i<markers.length; i++){
    markers[i].drawMark();
    if(markers[i].lifetime <1){
      markers.splice(i,1);
    }
  }

  //Detect Continuous aPressed sign
  if(aPressed){
    if(mouseX > paFiCanvas.contAreaSx && 
      mouseX < paFiCanvas.contAreaDx &&
      mouseY > paFiCanvas.contAreaSy &&
      mouseY < paFiCanvas.contAreaDy){
      aPressed++;      
    }
  }

  //Figure
  if (nPressed){
    background(10,10,10);
    aPressed = 0;
    aPressedChecker = 0;
    sPressed = 0;
    nPressed = 0;
    lPressed = 0;
    bPressed = 0;
    onePressed = 0;
    zeroPressed = 0;
    snapIterator = 0;
  }
  else if (aPressed){
    if(aPressed> aPressedChecker+1){
      aPressedChecker = aPressed; // Do nothing
    }
    else if(aPressed > marketData.candles.length-1){
      //Redraw
      paFiCanvas.drawLatestDate(aPressed);
      paFiCanvas.drawMatrix(aPressed);
      paFiCanvas.drawSigns(aPressed);
    }
    else if(aPressed > aPressedChecker){ //Update Draw
      paFiCanvas.copyPosition(aPressed);
      snapShots[aPressed].trade(aPressed);
      paFiCanvas.drawLatestDate(aPressed);
      paFiCanvas.drawMatrix(aPressed);
      paFiCanvas.drawSigns(aPressed);
      aPressedChecker = aPressed;
    }
    else{ //Redraw
      paFiCanvas.drawLatestDate(aPressed);
      paFiCanvas.drawMatrix(aPressed);
      paFiCanvas.drawSigns(aPressed);
    }
  }
  else if (sPressed){
    //FigureMatrix
    if(snapIterator < marketData.candles.length){
    // if(snapIterator > debug_snapShotID-3 && snapIterator < debug_snapShotID+1){
      if(debug_snapIterator){console.log("===== "+snapIterator+" =====");}
        //SnapShot Date
      paFiCanvas.drawMatrix(snapIterator);
      // paFiCanvas.drawSigns(snapIterator);
      paFiCanvas.drawLatestDate(snapIterator);
    }
    if(snapIterator < marketData.candles.length){
      snapIterator++;
    }
    else if (snapIterator == marketData.candles.length){
      paFiCanvas.drawLatestDate(marketData.candles.length-1);
      paFiCanvas.drawMatrix(marketData.candles.length-1);
      // console.log("Iteration done.");
    }    
  }
  else if (lPressed){ //Draw Last Result
    var candleID = marketData.candles.length-1 - bPressed;
    paFiCanvas.drawLatestDate(candleID);
    paFiCanvas.drawMatrix(candleID);
  }
  if (ePressed){
      labels_position_x = globalX;
      labels_position_y = globalY;
      var candleID = marketData.candles.length-1 - bPressed;
      paFiCanvas.drawLatestDate(candleID);
      paFiCanvas.drawTitleLabel();

  }

    arbitor = 0;

}


function keyTyped(){

  if(arbitor) return;

  // console.log("keyTyped.",key);
  if(key == "a"){
    console.log("a typed");
    aPressed++;
  }
  else if(key == "b"){
    bPressed ++;
    console.log("b typed:",bPressed);
  }
  else if(key == "f"){
    if(bPressed > 0){
      bPressed --;
    }
    console.log("f typed:",bPressed);
  }
  else if(key == "c"){ //Actions
    console.log("c typed");
    console.log(tradeActions);
  }
  else if(key == "d"){
    console.log("d typed");
    for(var i=0; i<markers.length; i++){
      markers[i].drawMark();
    }
  }
    else if (key == "e"){
      console.log("e typed");
      ePressed = 1;
  }
  else if(key == "l"){
    console.log("l typed");
    lPressed = 1;
  }
  else if (key == "n"){
    console.log("n typed");
    nPressed=1;
  }
  else if(key == "p"){ // Positions
    console.log("p typed");
    console.log(snapShots[aPressed].figureMatrix.tradeBuyPosition);
    console.log(snapShots[aPressed].figureMatrix.tradeSellPosition);
  }
  else if(key == "r"){ // Reset
    console.log("r typed");
    tradeActions = []; //Delete all actions
  }
  else if (key == "s"){
    console.log("s typed");
    sPressed=1;
  }
  else if(key == "t"){ // Check tradeRecords
    console.log("t typed");
    console.log(tradeRecords);
    console.log("Balance = ",balance);
    saveTradeRecords();    

  }
  else if (key == "v"){
    console.log("v typed");
    var newMarker = new Marker();
    newMarker.figure = "Price";
    newMarker.sx = mouseX;
    newMarker.sy = mouseY;
    newMarker.ID = markers.length;
    newMarker.drawMark();
    markers.push(newMarker);
  }
  else if (key == "1"){ //Buy Entry
    console.log("1 typed");
    var newAction = new TradeAction();
    newAction.initParam(mouseX,mouseY,"BuyEntry");
    tradeActions.push(newAction);
    var newMarker = new Marker();
    newMarker.figure = "Price";
    newMarker.sx = mouseX;
    newMarker.sy = mouseY;
    newMarker.ID = markers.length;
    newMarker.drawMark();
    markers.push(newMarker);

  }
  else if (key == "2"){ //Buy Exit
    console.log("2 typed");
    var newAction = new TradeAction();
    newAction.initParam(mouseX,mouseY,"BuyExit");
    tradeActions.push(newAction);
    var newMarker = new Marker();
    newMarker.figure = "Price";
    newMarker.sx = mouseX;
    newMarker.sy = mouseY;
    newMarker.ID = markers.length;
    newMarker.drawMark();
    markers.push(newMarker);
  }
  else if (key == "9"){ //Sell Entry
    console.log("9 typed");
    var newAction = new TradeAction();
    newAction.initParam(mouseX,mouseY,"SellEntry");
    tradeActions.push(newAction);
    var newMarker = new Marker();
    newMarker.figure = "Price";
    newMarker.sx = mouseX;
    newMarker.sy = mouseY;
    newMarker.ID = markers.length;
    newMarker.drawMark();
    markers.push(newMarker);
  }
  else if (key == "0"){ //Sell Exit
    console.log("0 typed");
    var newAction = new TradeAction();
    newAction.initParam(mouseX,mouseY,"SellExit");
    tradeActions.push(newAction);
    var newMarker = new Marker();
    newMarker.figure = "Price";
    newMarker.sx = mouseX;
    newMarker.sy = mouseY;
    newMarker.ID = markers.length;
    newMarker.drawMark();
    markers.push(newMarker);
  }
}
