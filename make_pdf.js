const fs = require("fs");
const http = require("http");
const moment = require("moment");
const html = fs.readFileSync("./template.html", "utf-8");
const mysql = require("mysql");
const url = require("url");
const express = require("express");
const app = express();
const create = require("./create_pdf.js");

var sqlResult = [];
var unit = [];

app.get('/vindicate', function (req, res) {
  const docid = req.query.docid;
  //连接mysql
  const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'123456',
    port:'3307',
    database:'mm',
    multipleStatements: true
  });
  connection.connect();
  const sql = "SELECT `ITEM_单位名称` as 项目单位,`ITEM_项目名称` as 工程项目,`ITEM_设计水深` as 设计水深,`ITEM_维护水深` as 维护水深,`ITEM_工程量` as 工程量,`ITEM_综合单价` as 综合单价,`ITEM_工程费用` as  工程费用,`ITEM_设计费用` as 设计费用,`ITEM_监理费用` as 监理费用,`ITEM_管理费用` as 管理费,`ITEM_总费用` as 计划费用,item_维修原因 as 维修原因,`ITEM_备注` as 备注 FROM `tlk_项目计划` where `ITEM_总表ID` = '"+ docid + "' and `ITEM_项目类型`='维护'";
  const sql2 = "SELECT `ITEM_单位名称` from `tlk_初步计划` where PARENT = '" + docid + "'";

  connection.query(sql2,function(err,result){
    if(err){
      console.log("err--",err.message);
      return;
    } 
    unit = result;
  });
  connection.query(sql,function(err,result){
    if(err){
      console.log("err--",err.message);
      return;
    } 
    sqlResult = result;
    HtmlToPdf();
  });
  connection.end();

  function HtmlToPdf(){
    var options = {
      format: "A4",
      orientation: "landscape",
      header: {
        height: "30mm"
      }
    };

    const units = [];
    for( let i in unit ){
      units.push(unit[i].ITEM_单位名称)
    };

    //json处理相同公司数据
    const map = {};
    for( let i in units ){
      map[units[i]] = [];
      for( let j in sqlResult ){
        if( units[i] == sqlResult[j].项目单位 ){          
          map[units[i]].push(sqlResult[j]);
        }
      }
    }

    var year = moment().format('YYYY年');
    var title = year + "度维护疏浚计划表";
    //表格数据
    var table = "<style>h2{margin-left:38%;}</style><table cellspacing='0'><tr><td rowspan='2' style='width:65px;'>项目单位</td><td rowspan='2'>序号</td><td rowspan='2'>工程名称</td><td>设计水深</td><td>维护水深</td><td>工程量</td><td>综合单价</td><td>工程费用</td><td>测量/设计费用</td><td>监理费用(3.6%)</td><td>管理费(4%)</td><td>计划费用</td><td rowspan='2'style='width:65px;'>资金来源</td><td rowspan='2' style='width:60px;'>备注</td></tr>";
    table += "<tr><td style='display:none'></td><td style='display:none'></td><td style='display:none'></td><td>m</td><td>m</td><td>万m3</td><td>元/m3</td><td>万元</td><td>万元</td><td>万元</td><td>万元</td><td>万元</td></tr>";
    var k = 1;
    var total_quantities = total_cost1 = total_cost2 = total_cost3 = total_cost4 = total_cost5 = 0;
    for( let i in map ){
      var quantities = cost1 = cost2 = cost3 = cost4 = cost5 = 0;
      for( var j=0;j<map[i].length+1;j++){
        if( j == 0 ){
          if(map[i][0].设计费用 == ""){
            table += "<tr><td rowspan='" + (map[i].length+1) + "'>" + map[i][0].项目单位 + "</td><td>" + k + "</td><td>" + map[i][0].工程项目 + "</td><td>" + map[i][0].设计水深 + "</td><td>" + map[i][0].维护水深 + "</td><td>" + map[i][0].工程量 + "</td><td>" + map[i][0].综合单价 + "</td><td>" + map[i][0].工程费用 + "</td><td>" + map[i][0].设计费用 + "</td><td>" + map[i][0].监理费用 + "</td><td>" + map[i][0].管理费 + "</td><td>" + map[i][0].计划费用 + "</td><td rowspan='" + (map[i].length+1) + "'>" + map[i][0].项目单位 + "</td><td>" + map[i][0].备注 + "</td></tr>";
            quantities += parseFloat(map[i][0].工程量);
            cost1 += parseFloat(map[i][0].工程费用);
            cost3 += parseFloat(map[i][0].监理费用);
            cost4 += parseFloat(map[i][0].管理费);
            cost5 += parseFloat(map[i][0].计划费用);          
            total_quantities += parseFloat(map[i][0].工程量);
            total_cost1 += parseFloat(map[i][0].工程费用);
            total_cost3 += parseFloat(map[i][0].监理费用);
            total_cost4 += parseFloat(map[i][0].管理费);
            total_cost5 += parseFloat(map[i][0].计划费用);            
            k++;
          }else{
            table += "<tr><td rowspan='" + (map[i].length+1) + "'>" + map[i][0].项目单位 + "</td><td>" + k + "</td><td>" + map[i][0].工程项目 + "</td><td colspan='4'>" + map[i][0].维修原因 + "</td><td>" + map[i][0].工程费用 + "</td><td>" + map[i][0].设计费用 + "</td><td>" + map[i][0].监理费用 + "</td><td>" + map[i][0].管理费 + "</td><td>" + map[i][0].计划费用 + "</td><td rowspan='" + (map[i].length+1) + "'>" + map[i][0].项目单位 + "</td><td>" + map[i][0].备注 + "</td></tr>";
            cost1 += parseFloat(map[i][0].工程费用);
            cost2 += parseFloat(map[i][0].设计费用);
            cost3 += parseFloat(map[i][0].监理费用);
            cost4 += parseFloat(map[i][0].管理费);
            cost5 += parseFloat(map[i][0].计划费用);
            total_cost1 += parseFloat(map[i][0].工程费用);
            total_cost2 += parseFloat(map[i][0].设计费用);
            total_cost3 += parseFloat(map[i][0].监理费用);
            total_cost4 += parseFloat(map[i][0].管理费);
            total_cost5 += parseFloat(map[i][0].计划费用);
            k++;
          }
        }else if( j< map[i].length ){
          if(map[i][j].设计费用 == ""){
            table += "<tr><td>" + k + "</td><td>" + map[i][j].工程项目 + "</td><td>" + map[i][j].设计水深 + "</td><td>" + map[i][j].维护水深 + "</td><td>" + map[i][j].工程量 + "</td><td>" + map[i][j].综合单价 + "</td><td>" + map[i][j].工程费用 + "</td><td>" + map[i][j].设计费用 + "</td><td>" + map[i][j].监理费用 + "</td><td>" + map[i][j].管理费 + "</td><td>" + map[i][j].计划费用 + "</td><td>" + map[i][j].备注 + "</td></tr>";
            quantities += parseFloat(map[i][j].工程量);
            cost1 += parseFloat(map[i][j].工程费用);
            cost3 += parseFloat(map[i][j].监理费用);
            cost4 += parseFloat(map[i][j].管理费);
            cost5 += parseFloat(map[i][j].计划费用);
            total_quantities += parseFloat(map[i][j].工程量);
            total_cost1 += parseFloat(map[i][j].工程费用);
            total_cost3 += parseFloat(map[i][j].监理费用);
            total_cost4 += parseFloat(map[i][j].管理费);
            total_cost5 += parseFloat(map[i][j].计划费用);
            k++;
          }else{
            table += "<tr><td>" + k + "</td><td>" + map[i][j].工程项目 + "</td><td colspan='4'>" + map[i][j].维修原因 + "</td><td>" + map[i][j].工程费用 + "</td><td>" + map[i][j].设计费用 + "</td><td>" + map[i][j].监理费用 + "</td><td>" + map[i][j].管理费 + "</td><td>" + map[i][j].计划费用 + "</td><td>" + map[i][j].备注 + "</td></tr>";
            cost1 += parseFloat(map[i][j].工程费用);
            cost2 += parseFloat(map[i][j].设计费用);
            cost3 += parseFloat(map[i][j].监理费用);
            cost4 += parseFloat(map[i][j].管理费);
            cost5 += parseFloat(map[i][j].计划费用);
            total_cost1 += parseFloat(map[i][j].工程费用);
            total_cost2 += parseFloat(map[i][j].设计费用);
            total_cost3 += parseFloat(map[i][j].监理费用);
            total_cost4 += parseFloat(map[i][j].管理费);
            total_cost5 += parseFloat(map[i][j].计划费用);
            k++;
          }
        }else{
          if( isNaN(quantities) ){ quantities = 0 };
          if( isNaN(cost1) ){ cost1 = 0 };
          if( isNaN(cost2) ){ cost2 = 0 };
          if( isNaN(cost3) ){ cost3 = 0 };
          if( isNaN(cost4) ){ cost4 = 0 };
          if( isNaN(cost5) ){ cost5 = 0 };
          table += "<tr><td colspan='2'><strong>小计</strong></td><td></td><td></td><td><strong>" + quantities + "</strong></td><td></td><td><strong>" + cost1.toFixed(2) + "</strong></td><td><strong>" + cost2 + "</strong></td><td><strong>" + cost3.toFixed(2) + "</strong></td><td><strong>" + cost4.toFixed(2) + "</strong></td><td><strong>" + cost5.toFixed(2) + "</strong></td><td></td></tr>";
        }
      }     
    }
    if( isNaN(total_quantities) ){ total_quantities =  0 };
    if( isNaN(total_cost1) ){ total_cost1 = 0 };
    if( isNaN(total_cost2) ){ total_cost2 = 0 };
    if( isNaN(total_cost3) ){ total_cost3 = 0 };
    if( isNaN(total_cost4) ){ total_cost4 = 0 };
    if( isNaN(total_cost5) ){ total_cost5 = 0 };
    table += "<tr><td colspan='3'><strong>合计</strong></td><td></td><td></td><td><strong>" + total_quantities + "</strong></td><td></td><td><strong>" + total_cost1.toFixed(2) + "</strong></td><td><strong>" + total_cost2 + "</strong></td><td><strong>" + total_cost3.toFixed(2) + "</strong></td><td><strong>" + total_cost4.toFixed(2) + "</strong></td><td><strong>" + total_cost5.toFixed(2) + "</strong></td><td></td><td></td></tr></table>";

    //正则替换
    var reg = [
      {
        relus: /_title_/g,
        match: title
      },
      {
        relus: /_table_/g,
        match: table
      }
    ];
    //传参到html
    create.createPDFProtocolFile(html, options, reg, res);
  }
})

app.get('/maintain', function (req, res) {
  const docid = req.query.docid;
  //连接mysql
  const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'123456',
    port:'3307',
    database:'mm',
    multipleStatements: true
  });
  connection.connect();
  const sql = "SELECT `ITEM_单位名称` as 项目单位,`ITEM_项目名称` as 工程项目,`ITEM_单位` as 单位,`ITEM_数量` as 数量,`ITEM_总费用` as 计划费用,item_维修原因 as 维修原因,`ITEM_备注` as 备注 FROM `tlk_项目计划` where `ITEM_总表ID` = '11e9-3c01-e51d7e66-92fa-4174df87c027' and `ITEM_项目类型`='维修'";
  const sql2 = "SELECT `ITEM_单位名称` from `tlk_初步计划` where PARENT = '" + docid + "'";

  connection.query(sql2,function(err,result){
    if(err){
      console.log("err--",err.message);
      return;
    } 
    unit = result;
  });
  connection.query(sql,function(err,result){
    if(err){
      console.log("err--",err.message);
      return;
    } 
    sqlResult = result;
    HtmlToPdf();
  });
  connection.end();

  function HtmlToPdf(){
    var options = {
      format: "A4",
      orientation: "landscape",
      header: {
        height: "30mm"
      }
    };

    const units = [];
    for( let i in unit ){
      units.push(unit[i].ITEM_单位名称)
    };

    //json处理相同公司数据
    const map = {};
    for( let i in units ){
      map[units[i]] = [];
      for( let j in sqlResult ){
        if( units[i] == sqlResult[j].项目单位 ){          
          map[units[i]].push(sqlResult[j]);
        }
      }
    }

    var year = moment().format('YYYY年');
    var title = year + "度港务建筑设施维修计划表";
    //表格数据
    var table = "<style>h2{margin-left:33%;}</style><table cellspacing='0'><tr><td>项目单位</td><td>序号</td><td>工程名称</td><td>计量单位</td><td>数量</td><td>计划费用(万元)</td><td>维修原因</td><td>备注</td></tr>";
    var k = 1;
    var total_cost = 0;
    for( let i in map ){
      var cost = 0;
      for( var j=0;j<map[i].length+1;j++){
        if( j == 0 ){
          if( map[i][0].维修原因 == null ){ map[i][0].维修原因 = "" };
          table += "<tr><td rowspan='" + (map[i].length+1) + "' style='width:100px'>" + map[i][0].项目单位 + "</td><td style='width:30px'>" + k + "</td><td style='width:100px'>" + map[i][0].工程项目 + "</td><td style='width:50px'>" + map[i][0].单位 + "</td><td style='width:50px'>" + map[i][0].数量 + "</td><td style='width:50px'>" + map[i][0].计划费用 + "</td><td style='width:200px'>" + map[i][0].维修原因 + "</td><td style='width:100px'>" + map[i][0].备注 + "</td></tr>";
          cost += parseFloat(map[i][0].计划费用);
          total_cost += parseFloat(map[i][0].计划费用);
          k++;
        }else if( j< map[i].length ){
          if( map[i][j].维修原因 == null ){ map[i][j].维修原因 = "" };
          table += "<tr><td>" + k + "</td><td>" + map[i][j].工程项目 + "</td><td>" + map[i][j].单位 + "</td><td>" + map[i][j].数量 + "</td><td>" + map[i][j].计划费用 + "</td><td>" + map[i][j].维修原因 + "</td><td>" + map[i][j].备注 + "</td></tr>";
          cost += parseFloat(map[i][j].计划费用);
          total_cost += parseFloat(map[i][j].计划费用);
          k++;
        }else{
          table += "<tr><td colspan='4'><strong>小计</strong></td><td><strong>" + cost.toFixed(2) + "</strong></td><td></td><td></td></tr>";
        }
      }     
    }
    table += "<tr><td colspan='5'><strong>合计</strong></td><td><strong>" + total_cost.toFixed(2) + "</strong></td><td></td><td></td></tr></table>";
    //正则替换
    var reg = [
      {
        relus: /_title_/g,
        match: title
      },
      {
        relus: /_table_/g,
        match: table
      }
    ];
    //传参到html
    create.createPDFProtocolFile(html, options, reg, res);
  }
})
app.listen(3002,function(){
  console.log("listening on 3002")
});