/*
 * @project: TERA
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2019 [progr76@gmail.com]
 * Web: https://terafoundation.org
 * Twitter: https://twitter.com/terafoundation
 * Telegram:  https://t.me/terafoundation
*/

require("./constant.js");
var fs = require('fs');
var file_name_info = GetDataPath("info.log");
var file_name_infoPrev = GetDataPath("info-prev.log");
CheckSizeLogFile(file_name_info, file_name_infoPrev);
var file_name_log = GetDataPath("log.log");
var file_name_logPrev = GetDataPath("log-prev.log");
CheckSizeLogFile(file_name_log, file_name_logPrev);
var file_name_log_web = GetDataPath("web.log");
var file_name_log_webPrev = GetDataPath("web-prev.log");
CheckSizeLogFile(file_name_log_web, file_name_log_webPrev);
var file_name_error = GetDataPath("err.log");
var file_name_errorPrev = GetDataPath("err-prev.log");
CheckSizeLogFile(file_name_error, file_name_errorPrev);
var file_name_error_tx = GetDataPath("err-tx.log");
var file_name_error_txPrev = GetDataPath("err-tx-prev.log");
CheckSizeLogFile(file_name_error_tx, file_name_error_txPrev);
global.ToLog = function (Str,Level)
{
    if(Level === undefined)
        Level = 1;
    if(Level && Level > global.LOG_LEVEL)
        return ;
    if(global.ALL_LOG_TO_CLIENT)
        ToLogClient(Str, undefined, undefined);
    else
        ToLogFile(file_name_log, Str);
}
global.WEB_LOG = 0;
global.ToLogWeb = function (Str)
{
    if(global.WEB_LOG)
    {
        SaveToLogFileSync(file_name_log_web, Str);
    }
}
global.SmallAddr = function (Str)
{
    return Str.substr(0, 5);
}
global.ToErrorTrace = function (Str)
{
    ToError("" + Str + ":" + new Error().stack);
}
global.ToLogTrace = function (Str)
{
    ToErrorTrace(Str);
}
global.ToInfo = function (Str)
{
    ToLogFile(file_name_info, Str, 1);
}
global.ToError = function (Str)
{
    ToLogFile(file_name_error, Str);
}
global.ToErrorTx = function (Str)
{
    SaveToLogFileSync(file_name_error_tx, Str);
    ToLog(Str);
}
function ToLogFile(file_name,Str,bNoFile)
{
    if(Str instanceof Error)
    {
        Str = Str.message + "\n" + Str.stack;
    }
    if(!global.START_SERVER)
        Str = global.PROCESS_NAME + ": " + Str;
    if(global.PROCESS_NAME !== "MAIN" && process.send)
    {
        process.send({cmd:"log", message:Str});
        return ;
    }
    else
    {
        console.log("" + START_PORT_NUMBER + ": " + GetStrOnlyTime() + ": " + Str);
    }
    if(bNoFile)
        return ;
    SaveToLogFileSync(file_name, Str);
}
global.ArrLogClient = [];
function ToLogClient(Str,StrKey,bFinal)
{
    if(!Str)
        return ;
    ToLogFile(file_name_log, Str);
    if(!StrKey)
        StrKey = "";
    ArrLogClient.push({time:GetStrOnlyTime(), text:Str, key:StrKey, final:bFinal, });
    if(ArrLogClient.length > 13)
        ArrLogClient.shift();
}
global.ToLogClient = ToLogClient;
global.ToLogClient0 = ToLogClient;
var StartStatTime;
var CONTEXT_STATS = {Total:{}, Interval:[]};
var CONTEXT_ERRORS = {Total:{}, Interval:[]};
var CurStatIndex = 0;
global.PrepareStatEverySecond = function ()
{
    CurStatIndex++;
    var index = GetCurrentStatIndex();
    CopyStatInterval(CONTEXT_STATS, index);
    CopyStatInterval(CONTEXT_ERRORS, index);
}
global.TO_ERROR_LOG = function (Module,ErrNum,Str,type,data1,data2)
{
    if(Str instanceof Error)
    {
        Str = Str.message + "\n";
    }
    if(type === "rinfo")
        Str += " from: " + data1.address + ':' + data1.port;
    else
        if(type === "node")
            Str += " from: " + data1.ip + ':' + data1.port;
    var Key = Module + ":" + ErrNum;
    ToError(" ==ERROR== " + Key + " " + Str);
    AddToStatContext(CONTEXT_ERRORS, Key);
    ADD_TO_STAT("ERRORS");
}
function GetCurrentStatIndex()
{
    var DefMaxStatPeriod = MAX_STAT_PERIOD * 2 + 2;
    return CurStatIndex % DefMaxStatPeriod;
}
global.HASH_RATE = 0;
global.ADD_HASH_RATE = function (Count)
{
    Count = Count / 1000000;
    global.HASH_RATE += Count;
    ADD_TO_STAT("HASHRATE", Count);
}
global.GET_STAT = function (Key)
{
    var Val = CONTEXT_STATS.Total[Key];
    if(!Val)
        Val = 0;
    return Val;
}
global.ADD_TO_STAT_TIME = function (Name,startTime,bDetail)
{
    if(global.STAT_MODE)
    {
        if(bDetail && global.STAT_MODE !== 2)
            return ;
        var Time = process.hrtime(startTime);
        var deltaTime = Time[0] * 1000 + Time[1] / 1e6;
        ADD_TO_STAT(Name, deltaTime);
    }
}
global.ADD_TO_STAT = function (Key,Count,bDetail)
{
    if(global.STAT_MODE)
    {
        if(bDetail && global.STAT_MODE !== 2)
            return ;
        AddToStatContext(CONTEXT_STATS, Key, Count);
    }
}
global.GET_STATDIAGRAMS = function (Keys)
{
    var now = GetCurrentTime();
    var index = GetCurrentStatIndex();
    if(!Keys || !Keys.length)
        return [];
    var Data = [];
    for(var i = 0; i < Keys.length; i++)
    {
        var name = Keys[i];
        var Value = GetDiagramData(CONTEXT_STATS, name);
        Data.push({name:name, maxindex:index, arr:Value, starttime:(StartStatTime - 0), steptime:1});
    }
    var MinLength = undefined;
    for(var i = 0; i < Data.length; i++)
    {
        var arr = Data[i].arr;
        if(arr.length > 0 && (MinLength === undefined || arr.length < MinLength))
            MinLength = arr.length;
    }
    var MaxSizeArr = 500;
    for(var i = 0; i < Data.length; i++)
    {
        var ItemServer = Data[i];
        var arr = ItemServer.arr;
        if(MinLength && arr.length > MinLength)
        {
            arr = arr.slice(arr.length - MinLength);
        }
        if(MinLength)
            if(",POWER_MY_WIN,POWER_BLOCKCHAIN,".indexOf("," + ItemServer.name + ",") >= 0)
            {
                arr = SERVER.GetStatBlockchain(ItemServer.name, MinLength);
            }
        var AvgValue = 0;
        for(var j = 0; j < arr.length; j++)
        {
            if(arr[j])
                AvgValue += arr[j];
        }
        if(arr.length > 0)
            AvgValue = AvgValue / arr.length;
        var StepTime = 1;
        if(ItemServer.name.substr(0, 4) === "MAX:")
        {
            while(arr.length >= MaxSizeArr)
            {
                arr = ResizeArrMax(arr);
                StepTime = StepTime * 2;
            }
        }
        else
        {
            while(arr.length >= MaxSizeArr)
            {
                arr = ResizeArrAvg(arr);
                StepTime = StepTime * 2;
            }
        }
        ItemServer.AvgValue = AvgValue;
        ItemServer.steptime = StepTime;
        ItemServer.arr = arr.slice(1);
    }
    return Data;
}
global.GET_STATS = function (Key)
{
    var now = GetCurrentTime();
    var index = GetCurrentStatIndex();
    var stats = {Counter:CONTEXT_STATS.Total, Counter10S:CalcInterval(CONTEXT_STATS, index, 10), Counter10M:CalcInterval(CONTEXT_STATS,
        index, 10 * 60), };
    var errors = {Counter:CONTEXT_ERRORS.Total, Counter10S:CalcInterval(CONTEXT_ERRORS, index, 10), Counter10M:CalcInterval(CONTEXT_ERRORS,
        index, 10 * 60), };
    var Period = (now - StartStatTime) / 1000;
    return {stats:stats, errors:errors, period:Period, Confirmation:[]};
}
global.StartCommonStat = function ()
{
    for(var key in CONTEXT_STATS.Total)
        return ;
    ClearCommonStat();
}
global.ClearCommonStat = function ()
{
    CurStatIndex = 0;
    StartStatTime = undefined;
    CONTEXT_STATS = {Total:{}, Interval:[]};
    CONTEXT_ERRORS = {Total:{}, Interval:[]};
    global.HASH_RATE = 0;
    SERVER.ClearStat();
}
function ResizeArrMax(arr)
{
    var arr2 = [];
    var Count2 = Math.trunc(arr.length / 2);
    for(var i = 0; i < Count2; i++)
    {
        arr2[i] = Math.max(arr[i * 2], arr[i * 2 + 1]);
    }
    return arr2;
}
function ResizeArrAvg(arr)
{
    var arr2 = [];
    var Count2 = Math.trunc(arr.length / 2);
    for(var i = 0; i < Count2; i++)
    {
        arr2[i] = (arr[i * 2] + arr[i * 2 + 1]) / 2;
    }
    return arr2;
}
function ResizeArr(arr)
{
    var arr2 = [];
    var Count2 = Math.trunc(arr.length / 2);
    for(var i = 0; i < Count2; i++)
    {
        arr2[i] = arr[i * 2];
    }
    return arr2;
}
global.ResizeArrAvg = ResizeArrAvg;
global.ResizeArrMax = ResizeArrMax;
function GetDiagramData(Context,Key)
{
    var DefMaxStatPeriod = MAX_STAT_PERIOD * 2 + 2;
    var IsMax;
    if(Key.substr(0, 4) === "MAX:")
        IsMax = true;
    else
        IsMax = false;
    var delta = MAX_STAT_PERIOD;
    var index2 = GetCurrentStatIndex();
    var index1 = (index2 - delta + DefMaxStatPeriod) % DefMaxStatPeriod;
    var Total = Context.Total;
    var Counter1;
    var arr = [];
    var PrevValue = undefined;
    for(var i = index1; i < index1 + delta; i++)
    {
        var index3 = i % DefMaxStatPeriod;
        Counter1 = Context.Interval[index3];
        if(Counter1)
        {
            var Value = Counter1[Key];
            if(Value !== undefined)
            {
                if(!IsMax)
                {
                    if(PrevValue !== undefined)
                    {
                        arr.push(Value - PrevValue);
                    }
                    else
                    {
                        arr.push(Value);
                    }
                    PrevValue = Value;
                }
                else
                {
                    arr.push(Value);
                }
            }
            else
            {
                arr.push(0);
            }
        }
    }
    return arr;
}
function CalcInterval(Context,index2,delta)
{
    var DefMaxStatPeriod = MAX_STAT_PERIOD * 2 + 2;
    var Res = {};
    var index1 = (index2 - delta + DefMaxStatPeriod) % DefMaxStatPeriod;
    var Total = Context.Total;
    var Counter1;
    for(var i = index1; i < index1 + delta; i++)
    {
        var index3 = i % DefMaxStatPeriod;
        Counter1 = Context.Interval[index3];
        if(Counter1)
            break;
    }
    if(Counter1)
        for(var Key in Total)
        {
            if(Key.substr(0, 4) === "MAX:")
                Res[Key] = 0;
            else
            {
                if(Counter1[Key] === undefined)
                    Res[Key] = Total[Key];
                else
                    Res[Key] = Total[Key] - Counter1[Key];
            }
        }
    return Res;
}
function AddToStatContext(Context,Key,AddValue)
{
    if(AddValue === undefined)
        AddValue = 1;
    var Val = Context.Total[Key];
    if(!Val)
        Val = 0;
    if(Key.substr(0, 4) === "MAX:")
        Val = Math.max(Val, AddValue);
    else
        Val = Val + AddValue;
    Context.Total[Key] = Val;
    if(!StartStatTime)
        StartStatTime = GetCurrentTime(0);
}
function CopyStatInterval(Context,index)
{
    var Counter = Context.Interval[index];
    if(!Counter)
    {
        Counter = {};
        Context.Interval[index] = Counter;
    }
    var Total = Context.Total;
    for(var Key in Total)
    {
        Counter[Key] = Total[Key];
        if(Key.substr(0, 4) === "MAX:")
            Total[Key] = 0;
    }
}
if(DEBUG_MODE)
    global.TO_DEBUG_LOG = function (Str,type,data1,data2)
    {
        if(!DEBUG_MODE)
            return ;
        if(type === "rinfo")
            Str += " from: " + data1.address + ':' + data1.port + ' - ' + data2.length;
        ToLog(Str);
    };
else
    global.TO_DEBUG_LOG = function (Str,type,data1,data2)
    {
    };
function SaveToLogFileAsync(fname,Str)
{
    fs.open(fname, "a", undefined, function (err,file_handle)
    {
        if(!err)
        {
            var StrLog = GetStrTime() + " : " + Str + "\r\n";
            fs.write(file_handle, StrLog, null, 'utf8', function (err,written)
            {
                if(!err)
                {
                    fs.close(file_handle, function (err)
                    {
                        if(err)
                            console.log(err);
                    });
                }
                else
                {
                    console.log("Ошибка записи в лог-файл ошибок!");
                }
            });
        }
        else
        {
            console.log("Ошибка открытия лог-файла ошибок");
        }
    });
}
function SaveToLogFileSync(fname,Str)
{
    try
    {
        var StrLog = GetStrTime() + " : " + Str + "\r\n";
        var file_handle = fs.openSync(fname, "a");
        fs.writeSync(file_handle, StrLog, null, 'utf8');
        fs.closeSync(file_handle);
    }
    catch(err)
    {
        console.log(err.message);
    }
}
global.GetStrOnlyTime = function (now)
{
    if(!global.GetCurrentTime)
        return ":::";
    if(!now)
        now = GetCurrentTime();
    var Str = "" + now.getHours().toStringZ(2);
    Str = Str + ":" + now.getMinutes().toStringZ(2);
    Str = Str + ":" + now.getSeconds().toStringZ(2);
    Str = Str + "." + now.getMilliseconds().toStringZ(3);
    return Str;
}
global.GetStrTime = function (now)
{
    if(!global.GetCurrentTime)
        return ":::";
    if(!now)
        now = GetCurrentTime();
    var Str = "" + now.getDate().toStringZ(2);
    Str = Str + "." + (1 + now.getMonth()).toStringZ(2);
    Str = Str + "." + now.getFullYear();
    Str = Str + " " + now.getHours().toStringZ(2);
    Str = Str + ":" + now.getMinutes().toStringZ(2);
    Str = Str + ":" + now.getSeconds().toStringZ(2);
    Str = Str + "." + now.getMilliseconds().toStringZ(3);
    return Str;
}
function CheckSizeLogFile(FILE_NAME_LOG,FILE_NAME_LOG_PREV)
{
    setInterval(function ()
    {
        fs.stat(FILE_NAME_LOG, function (err,stat)
        {
            if(err)
                return ;
            if(stat.size > MAX_SIZE_LOG)
            {
                fs.stat(FILE_NAME_LOG_PREV, function (err2,stat2)
                {
                    if(!err2)
                        fs.unlinkSync(FILE_NAME_LOG_PREV);
                    fs.rename(FILE_NAME_LOG, FILE_NAME_LOG_PREV, function (err3)
                    {
                        if(err3)
                            ToLog("**************** ERROR on rename file: " + FILE_NAME_LOG);
                        else
                            ToLog("truncate file " + FILE_NAME_LOG + " ok");
                    });
                });
            }
        });
    }, 60 * 1000);
}
