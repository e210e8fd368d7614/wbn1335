/*
 * @project: TERA
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2019 [progr76@gmail.com]
 * Web: https://terafoundation.org
 * Twitter: https://twitter.com/terafoundation
 * Telegram:  https://t.me/terafoundation
*/

var DELTA_LONG_MINING = 5000;
var BLOCKNUM_ALGO2 = 6560000;
var BLOCKNUM_HASH_NEW = 10195000;
var BLOCKNUM_TICKET_ALGO = 16070000;
if(typeof global === "object")
{
    global.GetHashFromSeqAddr = GetHashFromSeqAddr;
    global.CalcHashBlockFromSeqAddr = CalcHashBlockFromSeqAddr;
    global.GetHashFromNum2 = GetHashFromNum2;
    global.GetHashFromNum3 = GetHashFromNum3;
    global.GetHashFromArrNum2 = GetHashFromArrNum2;
    global.XORArr = XORArr;
    global.GetHash = GetHash;
    if(global.LOCAL_RUN || global.TEST_NETWORK || global.FORK_MODE)
    {
        BLOCKNUM_ALGO2 = 0;
        if(global.TEST_NETWORK)
        {
            BLOCKNUM_HASH_NEW = 100;
            BLOCKNUM_TICKET_ALGO = 0;
        }
        else
        {
            BLOCKNUM_HASH_NEW = 100;
            BLOCKNUM_TICKET_ALGO = 0;
        }
    }
}
function GetHashFromSeqAddr(SeqHash,AddrHash,BlockNum,PrevHash,MiningVer)
{
    if(BlockNum < BLOCKNUM_ALGO2)
    {
        var Hash = shaarrblock2(SeqHash, AddrHash, BlockNum);
        return {Hash:Hash, PowHash:Hash, Hash1:Hash, Hash2:Hash};
    }
    var MinerID = ReadUintFromArr(AddrHash, 0);
    var Nonce0 = ReadUintFromArr(AddrHash, 6);
    var Nonce1 = ReadUintFromArr(AddrHash, 12);
    var Nonce2 = ReadUintFromArr(AddrHash, 18);
    var DeltaNum1 = ReadUint16FromArr(AddrHash, 24);
    var DeltaNum2 = ReadUint16FromArr(AddrHash, 26);
    var PrevHashNum;
    if(PrevHash)
    {
        PrevHashNum = ReadUint32FromArr(PrevHash, 28);
    }
    else
    {
        PrevHashNum = ReadUint32FromArr(AddrHash, 28);
    }
    var Data = GetHash(SeqHash, PrevHashNum, BlockNum, MinerID, Nonce0, Nonce1, Nonce2, DeltaNum1, DeltaNum2);
    if(MiningVer)
    {
        if(AddrHash[17] !== MiningVer || AddrHash[23] !== MiningVer)
        {
            Data.PowHash = [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255];
        }
    }
    return Data;
}
function GetHash(BlockHash,PrevHashNum,BlockNum,Miner,Nonce0,Nonce1,Nonce2,DeltaNum1,DeltaNum2)
{
    if(DeltaNum1 > DELTA_LONG_MINING)
        DeltaNum1 = 0;
    if(DeltaNum2 > DELTA_LONG_MINING)
        DeltaNum2 = 0;
    var HashBase = GetHashFromNum2(BlockNum, PrevHashNum);
    var HashCurrent = GetHashFromArrNum2(BlockHash, Miner, Nonce0);
    var HashNonce1 = GetHashFromNum3(BlockNum - DeltaNum1, Miner, Nonce1);
    var HashNonce2 = GetHashFromNum3(BlockNum - DeltaNum2, Miner, Nonce2);
    var Hash1 = XORArr(HashBase, HashNonce1);
    var Hash2 = XORArr(HashCurrent, HashNonce2);
    var Ret = {Hash:Hash2, Hash1:Hash1, Hash2:Hash2};
    if(CompareArr(Hash1, Hash2) > 0)
    {
        Ret.PowHash = Hash1;
    }
    else
    {
        Ret.PowHash = Hash2;
    }
    if(BlockNum >= BLOCKNUM_HASH_NEW)
    {
        if(BlockNum >= BLOCKNUM_TICKET_ALGO)
            Ret.Hash = sha3arr2(Hash1, Hash2);
        else
            Ret.Hash = shaarr2(Hash1, Hash2);
    }
    return Ret;
}
function CalcHashBlockFromSeqAddr(Block,PrevHash,MiningVer)
{
    var Value = GetHashFromSeqAddr(Block.SeqHash, Block.AddrHash, Block.BlockNum, PrevHash, MiningVer);
    Block.Hash = Value.Hash;
    Block.PowHash = Value.PowHash;
}
function XORArr(Arr1,Arr2)
{
    var Ret = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for(var i = 0; i < 32; i++)
    {
        Ret[i] = Arr1[i] ^ Arr2[i];
    }
    return Ret;
}
function GetHashFromNum2(Value1,Value2)
{
    var MeshArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteUintToArrOnPos(MeshArr, Value1, 0);
    WriteUintToArrOnPos(MeshArr, Value2, 6);
    return sha3(MeshArr);
}
function GetHashFromArrNum2(Arr,Value1,Value2)
{
    var MeshArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0];
    WriteArrToArrOnPos(MeshArr, Arr, 0, 32);
    WriteUintToArrOnPos(MeshArr, Value1, 32);
    WriteUintToArrOnPos(MeshArr, Value2, 38);
    return sha3(MeshArr);
}
function GetHashFromNum3(Value1,Value2,Value3)
{
    var MeshArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteUintToArrOnPos(MeshArr, Value1, 0);
    WriteUintToArrOnPos(MeshArr, Value2, 6);
    WriteUintToArrOnPos(MeshArr, Value3, 12);
    return sha3(MeshArr);
}
function ReadUintFromArr(arr,len)
{
    if(len === undefined)
    {
        len = arr.len;
        arr.len += 6;
    }
    var value = (arr[len + 5] << 23) * 2 + (arr[len + 4] << 16) + (arr[len + 3] << 8) + arr[len + 2];
    value = value * 256 + arr[len + 1];
    value = value * 256 + arr[len];
    return value;
}
function ReadUint32FromArr(arr,len)
{
    if(len === undefined)
    {
        len = arr.len;
        arr.len += 4;
    }
    var value = (arr[len + 3] << 23) * 2 + (arr[len + 2] << 16) + (arr[len + 1] << 8) + arr[len];
    return value;
}
function ReadUint16FromArr(arr,len)
{
    if(len === undefined)
    {
        len = arr.len;
        arr.len += 2;
    }
    var value = (arr[len + 1] << 8) + arr[len];
    return value;
}
function ReadArrFromArr(arr,length)
{
    var Ret = [];
    var len = arr.len;
    for(var i = 0; i < length; i++)
    {
        Ret[i] = arr[len + i];
    }
    arr.len += length;
    return Ret;
}
function WriteUintToArr(arr,Num)
{
    var len = arr.length;
    arr[len] = Num & 0xFF;
    arr[len + 1] = (Num >>> 8) & 0xFF;
    arr[len + 2] = (Num >>> 16) & 0xFF;
    arr[len + 3] = (Num >>> 24) & 0xFF;
    var NumH = Math.floor(Num / 4294967296);
    arr[len + 4] = NumH & 0xFF;
    arr[len + 5] = (NumH >>> 8) & 0xFF;
}
function WriteUintToArrOnPos(arr,Num,Pos)
{
    arr[Pos] = Num & 0xFF;
    arr[Pos + 1] = (Num >>> 8) & 0xFF;
    arr[Pos + 2] = (Num >>> 16) & 0xFF;
    arr[Pos + 3] = (Num >>> 24) & 0xFF;
    var NumH = Math.floor(Num / 4294967296);
    arr[Pos + 4] = NumH & 0xFF;
    arr[Pos + 5] = (NumH >>> 8) & 0xFF;
}
function WriteUint16ToArr(arr,Num)
{
    var len = arr.length;
    arr[len] = Num & 0xFF;
    arr[len + 1] = (Num >>> 8) & 0xFF;
}
function WriteUint32ToArr(arr,Num)
{
    var len = arr.length;
    arr[len] = Num & 0xFF;
    arr[len + 1] = (Num >>> 8) & 0xFF;
    arr[len + 2] = (Num >>> 16) & 0xFF;
    arr[len + 3] = (Num >>> 24) & 0xFF;
}
function WriteUint32ToArrOnPos(arr,Num,Pos)
{
    arr[Pos] = Num & 0xFF;
    arr[Pos + 1] = (Num >>> 8) & 0xFF;
    arr[Pos + 2] = (Num >>> 16) & 0xFF;
    arr[Pos + 3] = (Num >>> 24) & 0xFF;
}
function WriteUint16ToArrOnPos(arr,Num,Pos)
{
    arr[Pos] = Num & 0xFF;
    arr[Pos + 1] = (Num >>> 8) & 0xFF;
}
function WriteArrToArr(arr,arr2,ConstLength)
{
    var len = arr.length;
    for(var i = 0; i < ConstLength; i++)
    {
        arr[len + i] = arr2[i];
    }
}
function WriteArrToArrOnPos(arr,arr2,Pos,ConstLength)
{
    for(var i = 0; i < ConstLength; i++)
    {
        arr[Pos + i] = arr2[i];
    }
}
function WriteArrToArrHOnPos(arr,arr2,Pos,ConstLength)
{
    for(var i = 0; i < ConstLength; i++)
    {
        arr[Pos + i] |= (arr2[i] << 8);
    }
}
function ConvertBufferToStr(Data)
{
    for(var key in Data)
    {
        var item = Data[key];
        if(item instanceof Buffer)
        {
            Data[key] = GetHexFromArr(item);
        }
        else
            if(typeof item === "object")
                ConvertBufferToStr(item);
    }
}
function CopyObjValue(obj,num)
{
    if(num && num > 5)
        return obj;
    var ret = {};
    for(var key in obj)
    {
        var val = obj[key];
        if((typeof val === "object") && !(val instanceof Buffer) && !(val instanceof ArrayBuffer) && !(val instanceof Array))
            val = CopyObjValue(val, num + 1);
        ret[key] = val;
    }
    return ret;
}
function CopyArr(arr1)
{
    var arr2 = [];
    if(arr1)
        for(var i = 0; i < arr1.length; i++)
            arr2[i] = arr1[i];
    return arr2;
}
function ParseNum(a)
{
    var Num = parseInt(a);
    if(!Num)
        Num = 0;
    if(isNaN(Num))
        Num = 0;
    if(Num < 0)
        Num = 0;
    return Num;
}
function CompareArr(a,b)
{
    for(var i = 0; i < a.length; i++)
    {
        if(a[i] !== b[i])
            return a[i] - b[i];
    }
    return 0;
}
function CompareArrL(a,b)
{
    if(a.length !== b.length)
        return a.length - b.length;
    for(var i = 0; i < a.length; i++)
    {
        if(a[i] !== b[i])
            return a[i] - b[i];
    }
    return 0;
}
function IsEqArr(a,b)
{
    return (CompareArr(a, b) === 0) ? 1 : 0;
}
function GetSeqHash(BlockNum,PrevHash,TreeHash)
{
    var arr = [GetArrFromValue(BlockNum), PrevHash, TreeHash];
    var SeqHash = CalcHashFromArray(arr, true);
    return SeqHash;
}
function arr2(Value1,Value2)
{
    var Buf = [];
    for(var n = 0; n < Value1.length; n++)
        Buf.push(Value1[n]);
    for(var n = 0; n < Value2.length; n++)
        Buf.push(Value2[n]);
    return Buf;
}
function shaarr2(Value1,Value2)
{
    return shaarr(arr2(Value1, Value2));
}
function sha3arr2(Value1,Value2)
{
    return sha3(arr2(Value1, Value2));
}
function GetBlockArrFromBuffer(BufRead,Info)
{
    if(!BufRead || BufRead.length < 10)
        return [];
    var BLOCK_PROCESSING_LENGTH = 8;
    var BLOCK_PROCESSING_LENGTH2 = BLOCK_PROCESSING_LENGTH * 2;
    BufRead.len = 0;
    var StartNum = ReadUintFromArr(BufRead);
    var CountLoad = ReadUint32FromArr(BufRead);
    var BufSize = 6 + 4 + BLOCK_PROCESSING_LENGTH2 * 32 + 32 + 6 + CountLoad * 64;
    if(CountLoad <= 0 || BufSize !== BufRead.length)
    {
        return [];
    }
    var PrevBlock;
    var BlockArr = [];
    for(var i = 0; i < CountLoad + BLOCK_PROCESSING_LENGTH2; i++)
    {
        var Block = {};
        Block.BlockNum = StartNum + i;
        if(i < BLOCK_PROCESSING_LENGTH2)
        {
            Block.Hash = ReadArrFromArr(BufRead, 32);
        }
        else
        {
            if(i === BLOCK_PROCESSING_LENGTH2)
            {
                Block.SumHash = ReadArrFromArr(BufRead, 32);
                Block.SumPow = ReadUintFromArr(BufRead);
            }
            Block.TreeHash = ReadArrFromArr(BufRead, 32);
            Block.AddrHash = ReadArrFromArr(BufRead, 32);
            var arr = [];
            var start = i - BLOCK_PROCESSING_LENGTH2;
            for(var n = 0; n < BLOCK_PROCESSING_LENGTH; n++)
            {
                var Prev = BlockArr[start + n];
                arr.push(Prev.Hash);
            }
            Block.PrevHash = CalcHashFromArray(arr, true);
            Block.SeqHash = GetSeqHash(Block.BlockNum, Block.PrevHash, Block.TreeHash);
            var PrevHashNum = ReadUint32FromArr(Block.PrevHash, 28);
            var PrevAddrNum = ReadUint32FromArr(Block.AddrHash, 28);
            if(PrevHashNum !== PrevAddrNum && Block.BlockNum > 20000000)
            {
                if(global.WATCHDOG_DEV)
                {
                    var Str = "";
                    if(Info && Info.Node)
                        Str = " from " + NodeName(Info.Node);
                    ToError("Error on block load: " + Block.BlockNum + Str);
                }
                return [];
            }
            CalcHashBlockFromSeqAddr(Block, Block.PrevHash);
            Block.Power = GetPowPower(Block.PowHash);
            if(PrevBlock)
            {
                Block.SumHash = shaarr2(PrevBlock.SumHash, Block.Hash);
            }
            PrevBlock = Block;
        }
        Block.TrCount = 0;
        Block.TrDataPos = 0;
        Block.TrDataLen = 0;
        BlockArr.push(Block);
    }
    for(var i = BlockArr.length - 1; i >= 0; i--)
    {
        var Block = BlockArr[i];
        if(!Block.SumHash)
        {
            BlockArr = BlockArr.slice(i + 1);
            break;
        }
    }
    return BlockArr;
}
function shaarrblock2(Value1,Value2,BlockNum)
{
    return shaarrblock(arr2(Value1, Value2), BlockNum);
}
if(typeof global === "object")
{
    global.ReadUint32FromArr = ReadUint32FromArr;
    global.ReadUintFromArr = ReadUintFromArr;
    global.ReadUint16FromArr = ReadUint16FromArr;
    global.WriteUintToArr = WriteUintToArr;
    global.WriteUint32ToArr = WriteUint32ToArr;
    global.WriteUint32ToArrOnPos = WriteUint32ToArrOnPos;
    global.WriteUint16ToArrOnPos = WriteUint16ToArrOnPos;
    global.WriteUintToArrOnPos = WriteUintToArrOnPos;
    global.WriteArrToArr = WriteArrToArr;
    global.WriteArrToArrOnPos = WriteArrToArrOnPos;
    global.WriteArrToArrHOnPos = WriteArrToArrHOnPos;
    global.ConvertBufferToStr = ConvertBufferToStr;
    global.CopyObjValue = CopyObjValue;
    global.CopyArr = CopyArr;
    global.ParseNum = ParseNum;
    global.CompareArr = CompareArr;
    global.CompareArrL = CompareArrL;
    global.IsEqArr = IsEqArr;
    global.shaarr2 = shaarr2;
    global.sha3arr2 = sha3arr2;
    global.arr2 = arr2;
    global.GetBlockArrFromBuffer = GetBlockArrFromBuffer;
    global.shaarrblock2 = shaarrblock2;
}
else
    if(typeof window === "object")
    {
        global = window;
    }
