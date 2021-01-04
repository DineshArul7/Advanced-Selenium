/**
* Manages the reference cache. In essence an Dictionary of all provided instances.
*/
function InternalProxy() {
var self = this;
self.TestMap = function () {
if (self.BackwardsInstanceDatabase.get.toString().indexOf("[native code]") === -1) {
throw "Map is not the native implementation.";
}
};
self.Reset = function () {
self.CurrentReferenceID = 0;
self.InstanceDataBase = {};
try {
self.BackwardsInstanceDatabase = new Map();
self.TestMap();
} catch (e) {
log("Map will not be used, because: " + e, LOG_SEV_INFO);
try {
self.BackwardsInstanceDatabase = new ToscaHashTable();
} catch (e) {
log("ToscaHashTable will not be used, because: " + e, LOG_SEV_INFO);
self.BackwardsInstanceDatabase = undefined;
}
}
self.ReferenceMap = [];
self.Counter = 0;
};
self.Reset();
}
/**
* Adds an object and returns the used ID.
* @param obj
* @returns {Number}
*/
InternalProxy.prototype.AddObject = function (obj) {
if (obj === undefined || obj === null)
throw "IntrernalProxy.AddObject: obj undefined";
if (this.BackwardsInstanceDatabase !== undefined) {
var cachedReferenceId = this.BackwardsInstanceDatabase.get(obj);
if (cachedReferenceId !== undefined) {
return cachedReferenceId;
}
} else {
for (var i = 0; i < this.ReferenceMap.length; i++) {
if (this.ReferenceMap[i].storedObject === obj) {
return this.ReferenceMap[i].reference;
}
}
}
while (this.Contains(this.CurrentReferenceID)) {
++this.CurrentReferenceID;
}
this.InstanceDataBase[this.CurrentReferenceID] = obj;
if (this.BackwardsInstanceDatabase !== undefined) {
this.BackwardsInstanceDatabase.set(obj, this.CurrentReferenceID);
} else {
this.ReferenceMap.push({ storedObject: obj, reference: this.CurrentReferenceID });
}
this.Counter++;
this.GetObject("0").MapExtensionMethods(obj);
return this.CurrentReferenceID;
};
/**
* Retrieves the cache object with the desired ID.
* @param referenceId
* @returns nothing
*/
InternalProxy.prototype.GetObject = function (referenceId) {
var currentObject = this.InstanceDataBase[referenceId];
return currentObject;
};
/**
* Deletes the cache object with the desired ID. Returns the deleted object.
* @param referenceId
* @returns the deleted object
*/
InternalProxy.prototype.DeleteObject = function (referenceId) {
if (!this.Contains(referenceId)) return null;
var deletedObject = this.InstanceDataBase[referenceId];
if (this.BackwardsInstanceDatabase !== undefined) {
if (this.BackwardsInstanceDatabase instanceof ToscaHashTable) {
this.BackwardsInstanceDatabase["remove"].apply(this.BackwardsInstanceDatabase, [deletedObject]);
} else {
this.BackwardsInstanceDatabase["delete"].apply(this.BackwardsInstanceDatabase, [deletedObject]);
}
} else {
for (var i = 0; i < this.ReferenceMap.length; i++) {
if (this.ReferenceMap[i].storedObject === deletedObject) {
this.ReferenceMap[i].splice(i, 1);
break;
}
}
}
delete this.InstanceDataBase[referenceId];
this.Counter--;
return deletedObject;
};
/**
* Checks if the cache contains an item with the desired ID.
*
* @param referenceId
* @returns {Boolean}
*/
InternalProxy.prototype.Contains = function (referenceId) {
var foundObject = this.InstanceDataBase[referenceId];
return typeof foundObject != "undefined";
};
InternalProxy.prototype.Count = function () {
return this.Counter;
};
var toscaForEach = function (array, callback) {
var T, k, fToBind;
if (array == null) {
throw new TypeError('this is null or not defined');
}
// 1. Let O be the result of calling toObject() passing the
// |this| value as the argument.
var O = Object(array);
// 2. Let lenValue be the result of calling the Get() internal
// method of O with the argument "length".
// 3. Let len be toUint32(lenValue).
var len = O.length >>> 0;
// 4. If isCallable(callback) is false, throw a TypeError exception.
// See: http://es5.github.com/#x9.11
if (typeof callback !== 'function') {
throw new TypeError(callback + ' is not a function');
}
// 5. If thisArg was supplied, let T be thisArg; else let
// T be undefined.
if (arguments.length > 2) {
T = arguments[2];
}
// 6. Let k be 0.
k = 0;
// 7. Repeat while k < len.
while (k < len) {
var kValue;
// a. Let Pk be ToString(k).
//    This is implicit for LHS operands of the in operator.
// b. Let kPresent be the result of calling the HasProperty
//    internal method of O with argument Pk.
//    This step can be combined with c.
// c. If kPresent is true, then
if (k in O) {
// i. Let kValue be the result of calling the Get internal
// method of O with argument Pk.
kValue = O[k];
// ii. Call the Call internal method of callback with T as
// the this value and argument list containing kValue, k, and O.
callback.call(fToBind, T, kValue, k, O);
}
// d. Increase k by 1.
k++;
}
// 8. return undefined.
};
var toscaBind = function (functionToBind, oThis) {
if (typeof functionToBind !== 'function') {
// closest thing possible to the ECMAScript 5
// internal IsCallable function
throw new TypeError('toscaBind - what is trying to be bound is not callable');
}
var aArgs = Array.prototype.slice.call(arguments, 2),
fToBind = functionToBind,
fNOP = function () { },
fBound = function () {
return fToBind.apply(functionToBind instanceof fNOP && oThis
? functionToBind
: oThis,
aArgs.concat(Array.prototype.slice.call(arguments, 1)));
};
if (functionToBind.prototype) {
fNOP.prototype = functionToBind.prototype;
}
fBound.prototype = new fNOP();
return fBound;
};
var ToscaHashTable = function () {
this._storage = [];
this._count = 0;
this._limit = 8;
};
ToscaHashTable.prototype.set = function (key, value) {
//create an index for our storage location by passing it through our hashing function
var index = this.hashFunc(key, this._limit);
//retrieve the bucket at this particular index in our storage, if one exists
//[[ [k,v], [k,v], [k,v] ] , [ [k,v], [k,v] ]  [ [k,v] ] ]
var bucket = this._storage[index];
//does a bucket exist or do we get undefined when trying to retrieve said index?
if (!bucket) {
//create the bucket
var bucket = [];
//insert the bucket into our ToscaHashTable
this._storage[index] = bucket;
}
var override = false;
//now iterate through our bucket to see if there are any conflicting
//key value pairs within our bucket. If there are any, override them.
for (var i = 0; i < bucket.length; i++) {
var tuple = bucket[i];
if (tuple[0] === key) {
//overide value stored at this key
tuple[1] = value;
override = true;
}
}
if (!override) {
//create a new tuple in our bucket
//note that this could either be the new empty bucket we created above
//or a bucket with other tupules with keys that are different than
//the key of the tuple we are inserting. These tupules are in the same
//bucket because their keys all equate to the same numeric index when
//passing through our hash function.
bucket.push([key, value]);
this._count++
//now that we've added our new key/val pair to our storage
//let's check to see if we need to resize our storage
if (this._count > this._limit * 0.75) {
this.resize(this._limit * 2);
}
}
return this;
};
ToscaHashTable.prototype.remove = function (key) {
var index = this.hashFunc(key, this._limit);
var bucket = this._storage[index];
if (!bucket) {
return null;
}
//iterate over the bucket
for (var i = 0; i < bucket.length; i++) {
var tuple = bucket[i];
//check to see if key is inside bucket
if (tuple[0] === key) {
//if it is, get rid of this tuple
bucket.splice(i, 1);
this._count--;
if (this._count < this._limit * 0.25) {
this.resize(this._limit / 2);
}
return tuple[1];
}
}
};
ToscaHashTable.prototype.get = function (key) {
var index = this.hashFunc(key, this._limit);
var bucket = this._storage[index];
if (!bucket) {
return undefined;
}
for (var i = 0; i < bucket.length; i++) {
var tuple = bucket[i];
if (tuple[0] === key) {
return tuple[1];
}
}
return undefined;
};
ToscaHashTable.prototype.hashFunc = function (obj, max) {
var retval = undefined;
var tagName = undefined;
try {
tagName = obj.tagName;
retval = tagName;
} catch (e) {
retval = "NO_TAGNAME_BUCKET";
}
if (tagName === undefined || tagName === null) {
retval = "NO_TAGNAME_BUCKET";
}
return this.hashFuncStr(retval, max);
};
ToscaHashTable.prototype.hashFuncStr = function (str, max) {
var hash = 0;
for (var i = 0; i < str.length; i++) {
var letter = str.charAt(0);
hash = (hash << 5) + letter.charCodeAt(0);
hash = (hash & hash) % max;
}
return hash;
};
ToscaHashTable.prototype.resize = function (newLimit) {
var oldStorage = this._storage;
this._limit = newLimit;
this._count = 0;
this._storage = [];
var handleBucket = function (bucket) {
if (!bucket) {
return;
}
for (var i = 0; i < bucket.length; i++) {
var tuple = bucket[i];
this.set(tuple[0], tuple[1]);
}
};
if (!Function.prototype.bind) {
if (!Array.prototype.forEach) {
toscaForEach(oldStorage, toscaBind(handleBucket, this));
} else {
oldStorage.forEach(toscaBind(handleBucket, this));
}
} else {
if (!Array.prototype.forEach) {
toscaForEach(oldStorage, handleBucket.bind(this));
} else {
oldStorage.forEach(handleBucket.bind(this));
}
}
};
var TYPENAMEPREFIX = "XBrowser:";
var CURRENT_ENCODING = "UTF-8";
var CURRENT_BROWSER = "Chrome";
var EXTENSION_VERSION = chrome.runtime.getManifest().version;
/**
* This class provides methods used for JS reflection.
*/
var AsyncMethod = "ASYNC";
function Reflection() {
/**
* Returns the names of all the obj's variables and functions in a sorted array
*/
this.getMembers = function(obj) {
var retVal = returnMembersReflectionDelegate(obj, function(member) {
return true;
});
return retVal;
};
this.getMethods = function(obj) {
var retVal = returnMembersReflectionDelegate(obj, function(member) {
return (typeof member) == "function";
});
return retVal;
};
this.getProperties = function(obj) {
var retVal = returnMembersReflectionDelegate(obj, function(member) {
return (typeof member) != "function";
});
return retVal;
};
function IndexOf(array, value) {
if (typeof(array.indexOf) === 'function') {
return array.indexOf(value);
}
// IE quirks mode support
for (var i = 0; i < array.length; i++) {
if (array[i] === value) {
return i;
}
}
return -1;
}
;
function isToscaMember(member) {
if (member === "toscareference") {
return true;
}
return false;
};
function returnMembersReflectionDelegate(obj, delegateUsedForCheck) {
var members = [];
// var i = 0;
if (!obj) {
return members;
}
// Because there can be errors during traversing the properties, exceptions
// are only logged.
try {
for (var member in obj) {
try {
// Technical Property can not start with a number
if (delegateUsedForCheck(obj[member]) && IndexOf(members, member) === -1 && isNaN(member) && !isToscaMember(member)) {
members.push(member);
}
} catch (e2) {
log("[Reflection.returnMembersReflectionDelegate] Error in Reflection on " + obj + " message:" + e2, LOG_SEV_WARN);
}
}
} catch(e) {
log("[Reflection.returnMembersReflectionDelegate] Error in Reflection on " + obj + " message:" + e, LOG_SEV_WARN);
}
return members.sort();
}
this.areSameBaseType = function(possibleChild, possibleAncestor) {
// Null checks
if ((possibleChild == null) && (possibleAncestor != null)) {
return false;
}
if ((possibleChild != null) && (possibleAncestor == null)) {
return false;
}
if ((possibleChild == null) && (possibleAncestor == null)) {
return true;
}
/*
* simple type check. Possible values: boolean, string, number, function,
* object, undefined.
*
*/
if ((typeof possibleChild) != (typeof possibleAncestor)) {
return false;
}
var ancMembers = this.getMembers(possibleAncestor);
for (var currentMemberName in ancMembers) {
if (!(currentMemberName in possibleChild)) {
return false;
}
}
return true;
};
this.setProperty = function(obj, propertyToSet, propertyValue) {
if (!(propertyToSet in obj)) {
// Switch to "true" if you want to display the available properties in the exception message.
if (false) {
var properties = this.getProperties(obj);
throw "Property >" + propertyToSet + "< not found in " + this.GetType(obj) + "List of available properties: " + properties.join(";");
} else {
throw "Property >" + propertyToSet + "< not found in " + this.GetType(obj);
}
}
// Checks if the value is of type Boolean. If they are
// they must be treated special because everything non-null/non-primitive
// converts to true on assignment. The method valueOf() converts the
// object Boolean to primitive bool
if (propertyValue["valueOf"]) {
obj[propertyToSet] = propertyValue.valueOf();
} else {
obj[propertyToSet] = propertyValue;
}
};
this.getProperty = function(obj, propertyToGet) {
if (!(propertyToGet in obj)) {
// Switch to "true" if you want to display the available properties in the exception message.
if (false) {
var properties = this.getProperties(obj);
throw "Property >" + propertyToGet + "< not found in " + this.GetType(obj) + "List of available properties: " + properties.join(";");
} else {
throw "Property >" + propertyToGet + "< not found in " + this.GetType(obj);
}
}
try {
return obj[propertyToGet];
}
catch (e) {
return e.message;
}
};
this.invokeMethod = function(obj, methodToInvoke, parameters, callback) {
if (!(methodToInvoke in obj)) {
// Switch to "true" if you want to display the available methods in the exception message.
if (false) {
var methods = this.getMethods(obj);
throw "Method >" + methodToInvoke + "< not found in " + this.GetType(obj) + "List of available Methods: " + methods.join(";");
} else
throw "Method >" + methodToInvoke + "< not found in " + this.GetType(obj);
}
parameters.push(callback);
var returnValue = obj[methodToInvoke].apply(obj, parameters);
if (returnValue !== AsyncMethod) {
callback(returnValue);
return;
}
};
/**
* Returns SAP UI 5 type  if available.
*/
this.GetType = function (thing) {
var originalType = this.GetHtmlType(thing);
try {
if (IsSapUi5()) {
var sapUi5Class = new sapUi5().ExtractSapUi5Type(thing);
if (sapUi5Class) {
originalType = originalType + "|" + sapUi5Class;
}
}
} catch (e) {
}
return originalType;
};
/**
* Returns the emulated Javascript type.
*/
this.GetHtmlType = function(thing) {
if (thing === undefined || thing === null) {
return "undefined";
}
if (isAttribute(thing)) {
// Attr nodes have a property "nodeName" which is the name of the attribute, we don't want to return that as the type (next bit of code)
return "Attr";
}
try {
if (!isSVGElement(thing) && thing.nodeName) {
return thing.nodeName.toUpperCase();
}
} catch(e) {
//Welcome to JavaScript...
}
if (thing.TypeSimulation) {
return thing.TypeSimulation;
}
var typeName;
typeName = ExtractClassNameFromToString(thing);
if (typeName !== "Object" && typeName !== undefined) {
return typeName;
}
if (thing.constructor) {
typeName = thing.constructor.name;
if (typeName !== "Object" && typeName !== undefined) {
return typeName;
}
typeName = ExtractClassNameFromConstructorFunction(thing);
if (typeName !== "Object" && typeName !== undefined) {
return typeName;
}
}
// workaround for oddities in IE9 Quirks Mode for IHTMLRect and DispHTMLCurrentStyle objects
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_IE) {
if (Object.prototype.hasOwnProperty.call(thing, "display") && Object.prototype.hasOwnProperty.call(thing, "hasLayout"))
return "MSCurrentStyleCSSProperties";
else if (Object.prototype.hasOwnProperty.call(thing, "top") && Object.prototype.hasOwnProperty.call(thing, "right"))
return "ClientRect";
}
return "Object";
};
}
function isSVGElement(thing) {
return thing.viewportElement !== undefined;
}
function isAttribute(thing) {
if (typeof Attr != "undefined") {
return thing instanceof Attr;
}
return typeof(thing.nodeName) != "undefined" &&
typeof(thing.nodeValue) != "undefined" &&
typeof(thing.expando) != "undefined" &&
typeof(thing.specified) != "undefined";
}
function ExtractClassNameFromConstructorFunction(obj)
{
if (obj && obj.constructor) {
try {
if (obj.constructor.toString) {
var arr = obj.constructor.toString().match(
/^\s*function\s*(\w+)/);
if (arr && arr.length === 2) {
return arr[1];
}
}
}
catch(e) {
return "Object";
}
}
return "Object";
}
function ExtractClassNameFromToString(objUnderTest) {
var hope = Object.prototype.toString.call(objUnderTest);
var classNames = hope.split(" ");
if (classNames.length >= 2) {
var secondHalf = classNames[classNames.length - 1];
var onlyClassName = secondHalf.replace(/]/g, "");
return onlyClassName;
} else if (classNames.length === 1) {
var possibleObjectName = classNames[0].replace(/\]/g, "");
possibleObjectName = possibleObjectName.replace(/\[/g, "");
return possibleObjectName;
}
throw "TypeServer.GetType: unknown type detected: " + hope;
}
function TechnicalTypeInfo(obj) {
var reflectionHelper = new Reflection();
this.GetMethod = function (methodName) {
var allMethods = this.GetMethods();
for (var currentMethodIndex in allMethods) {
if (allMethods[currentMethodIndex].Name === methodName) {
return allMethods[currentMethodIndex];
}
}
throw "Type >" + this.Name + "< has no method >" + methodName + "<.";
};
this.GetProperty = function (propertyName) {
var allProps = this.GetProperties();
for (var currentPropertyIndex in allProps) {
if (allProps[currentPropertyIndex].Name === propertyName) {
return allProps[currentPropertyIndex];
}
}
throw "Type >" + this.Name + "< has no property >" + propertyName + "<.";
};
this.Name = reflectionHelper.GetType(obj);
this.GetMethods = function () {
var allMethods = reflectionHelper.getMethods(obj);
var retVal = [];
for (var currentMethodIndex in allMethods) {
var wrappedMethod = new TechnicalMethodInfo(allMethods[currentMethodIndex]);
retVal.push(wrappedMethod);
}
return retVal;
};
this.GetProperties = function () {
var allProperties = reflectionHelper.getProperties(obj);
var retVal = [];
for (var currentPropertyIndex in allProperties) {
var wrappedProperty = new TechnicalPropertyInfo(allProperties[currentPropertyIndex]);
retVal.push(wrappedProperty);
}
return retVal;
};
function getPrototypeOf(obj) {
if (typeof Object.getPrototypeOf !== "function") {
return null;
}
return Object.getPrototypeOf(obj);
}
this.GetSuperTypes = function () {
var types = new Array();
var prototype = getPrototypeOf(obj);
if (prototype != null) {
types.push(new TechnicalTypeInfo(prototype));
}
return types;
};
}
function TechnicalMethodInfo(method) {
var reflectionHelper = new Reflection();
this.Name = method.name;
this.ReturnType = TechnicalTypeInfo.prototype.ObjectTypeInfo;
this.Parameters = function () {
var retVal = [];
for (var i = 0; i < method.length; i++) {
var currentParam = new TechnicalParameterInfo("param" + i);
retVal.push(currentParam);
}
return retVal;
};
this.Invoke = function(objectToInvoke, parameters) {
return reflectionHelper.invokeMethod(objectToInvoke, this.Name, parameters);
};
}
function TechnicalPropertyInfo(property) {
var reflectionHelper = new Reflection();
this.Name = property;
this.SetValue = function(objectToSet, newValue) {
reflectionHelper.setProperty(objectToSet, this.Name, newValue);
};
this.GetValue = function (objectToGet) {
return reflectionHelper.getProperty(objectToGet, this.Name);
};
}
function TechnicalParameterInfo(parameter) {
this.Name = parameter;
}
function IsSapUi5() {
return document.documentElement.getAttribute('tosca_sapui_enabled');
}
var TOSCA_BROWSER_ID_IE = "InternetExplorer";
var TOSCA_BROWSER_ID_FF = "Firefox";
var TOSCA_BROWSER_ID_FFWEB = "FirefoxWebExtension";
var TOSCA_BROWSER_ID_Chrome = "Chrome";
var TOSCA_BROWSER_ID_Safari = "Safari";
var TOSCA_BROWSER_ID_Edge = "Edge";
var TOSCA_BROWSER_ID_EdgeChromium = "EdgeChromium";
var TOSCA_BROWSER_ID_Mobile = "Mobile";
var TOSCA_BROWSER_ID_Mobile30 = "Mobile30";
/**
* this class represents the request handler.
* Implementation of AbstractServer
*/
function RequestHandler(javaScriptServerToUse) {
var self = this;
var globalError = null;
self.javaScriptServer = javaScriptServerToUse;
self.WasAlreadyInstantiated = false;
self.reflection = new Reflection();
self.Base64 = new Base64();
self.Responses = new Array();
var errorFunction = function (evt) {
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_Edge && evt.message !== "InvalidStateError" && evt.message !== "Script error.") {
globalError = evt.message;
}
evt.preventDefault();
};
if (window.addEventListener !== undefined && window.addEventListener !== null) {
window.addEventListener("error", errorFunction);
} else {
if (window.attachEvent !== undefined && window.attachEvent !== null) {
window.attachEvent("onerror", errorFunction);
}
}
self.oldOnErrorFunction = window.onerror;
window.onerror = function (errorMsg, url, lineNumber) {
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_Edge && errorMsg !== "InvalidStateError") {
globalError = errorMsg;
}
if (self.oldOnErrorFunction != null) {
return self.oldOnErrorFunction.apply(this, [errorMsg, url, lineNumber]);
} else {
return true;
}
};
self.HandleTransaction = function(transaction, callback) {
var argumentsFailed = new TransactionFailedResponse();
if (transaction == null) {
argumentsFailed.Message = "Transaction is null.";
callback(argumentsFailed);
return;
} else if (!transaction.Uid) {
argumentsFailed.Message = "Transaction.Uid is not defined.";
callback(argumentsFailed);
return;
}
var tUid = transaction.Uid;
if (transaction.Reset) {
if (transaction.Parts == null || transaction.Parts.Count > 0) {
var responseFailedDueToParts = new TransactionFailedResponse();
responseFailedDueToParts.Message = "A Reset Transaction cannot contain Parts.";
responseFailedDueToParts.Uid = tUid;
callback(responseFailedDueToParts);
return;
}
if (this.WasAlreadyInstantiated) {
//Only reset if there is a need for
self.Reset();
}
var response = new TransactionSuccessResponse();
response.Uid = tUid;
callback(response);
return;
}
if (this.WasAlreadyInstantiated === false) {
var responseFailedDueToReset = new TransactionFailedResponse();
responseFailedDueToReset.Message = "Server has been reset";
responseFailedDueToReset.Uid = tUid;
responseFailedDueToReset.IsReset = true;
this.WasAlreadyInstantiated = true;
callback(responseFailedDueToReset);
return;
}
var moreResponsesAvailable = self.Responses != null && self.Responses.length > 0;
if (transaction.GetMoreParts && moreResponsesAvailable) {
var response = self.Responses.shift();
callback(response);
return;
} else if (transaction.GetMoreParts && !moreResponsesAvailable) {
argumentsFailed.Message = "No more parts available to send.";
callback(argumentsFailed);
return;
} else if (!transaction.GetMoreParts && moreResponsesAvailable) {
argumentsFailed.Message = "More parts from the previous transaction available to send.";
callback(argumentsFailed);
return;
} else if (!transaction.GetMoreParts && !moreResponsesAvailable) {
if (!transaction.Parts) {
argumentsFailed.Uid = transaction.Uid;
argumentsFailed.Message = "Transaction.Parts is not defined.";
callback(argumentsFailed);
return;
}
try {
this.HandleTransactionInternal(transaction, function(returnValue) {
self.Responses = returnValue;
callback(self.Responses.shift());
});
return;
} catch(e) {
var failedResponse = self.FillFailedResponse(new TransactionFailedResponse(), "[RequestHandler.HandleTransaction]", e, tUid);
callback(failedResponse);
return;
}
}
argumentsFailed.Message = "No responses to send available";
callback(argumentsFailed);
};
self.FillFailedResponse = function (responseFailed, location, exception, tUid, objectId) {
if (exception instanceof TypedException) {
responseFailed.Type = exception.type;
exception = exception.exception;
}
var errorString;
if (exception.name !== undefined && exception.message !== undefined) {
errorString = location + " " + exception.name + ": " + exception.message + LB + exception.stack;
} else {
errorString = location + " " + exception.toString();
}
log(errorString, LOG_SEV_ERROR);
responseFailed.Message = errorString;
responseFailed.Uid = tUid;
responseFailed.StackTrace = exception.stack;
responseFailed.TargetObject = objectId;
return responseFailed;
};
self.FillFailedResponseAlternative = function (responseFailed, location, errorString, tUid, objectId) {
log(errorString, LOG_SEV_ERROR);
responseFailed.Message = errorString;
responseFailed.Uid = tUid;
responseFailed.StackTrace = "";
responseFailed.TargetObject = objectId;
return responseFailed;
};
self.HandleTransactionInternal = function(transaction, callback) {
var tUid = transaction.Uid;
var parts = transaction.Parts;
var transactionResponses = new Array();
var partResponseArray = new Array();
var maxParts = 10000;
var currParts = 0;
var response;
var counter = 0;
for (var k = 0; k < parts.length; k++) {
this.HandleTransactionPart(parts[k], GetPartResponse);
}
function GetPartResponse(partResponse) {
partResponseArray.push(partResponse);
currParts++;
if (currParts === maxParts) {
HandleOverflowParts();
}
if (counter === parts.length - 1) {
HandleLastPart();
callback(transactionResponses);
}
counter++;
}
function HandleOverflowParts() {
if (response != null)
response.MorePartsAvailable = true;
currParts = 0;
response = new TransactionSuccessResponse();
response.Uid = tUid;
response.Parts = partResponseArray;
transactionResponses.push(response);
partResponseArray = new Array();
}
function HandleLastPart() {
if (partResponseArray.length > 0) {
if (response != null)
response.MorePartsAvailable = true;
response = new TransactionSuccessResponse();
response.Uid = tUid;
response.Parts = partResponseArray;
transactionResponses.push(response);
}
}
};
self.HandleTransactionPart = function(transactionPart, callback) {
var argumentsFailed = new TransactionPartFailedResponse();
if (transactionPart == null) {
argumentsFailed.Message = "TransactionPart is null.";
callback(argumentsFailed);
return;
} else if (!transactionPart.Uid) {
argumentsFailed.Message = "TransactionPart.Uid is not defined.";
callback(argumentsFailed);
return;
} else if (!transactionPart.Tasks) {
argumentsFailed.Uid = transactionPart.Uid;
argumentsFailed.Message = "TransactionPart.Tasks is not defined.";
callback(argumentsFailed);
return;
} else if ((!transactionPart.TargetObject) && (isNaN(transactionPart.TargetObject))) {
argumentsFailed.Uid = transactionPart.Uid;
argumentsFailed.Message = "TransactionPart.TargetObject is not valid.";
callback(argumentsFailed);
return;
}
var partUid = transactionPart.Uid;
var tasks = transactionPart.Tasks;
try {
var partResponse = new TransactionPartSuccessResponse();
partResponse.Uid = partUid;
var counter = 0;
var targetObjectId = transactionPart.TargetObject;
var addToResponse = function (taskResponse) {
partResponse.Tasks.push(taskResponse);
if (counter === tasks.length - 1) {
callback(partResponse);
}
counter++;
};
var checkTheResponse = function (taskResponse) {
if (!globalError) {
addToResponse(taskResponse);
}
};
var containsReleaseTask;
var containsOtherTask;
for (var k = 0; k < tasks.length; k++) {
var task = tasks[k];
var taskType = task.$type;
if (taskType === "Tricentis.Automation.Remoting.Transactions.Tasks.ReleaseObjectTransactionTask, Tricentis.Automation.Remoting") {
containsReleaseTask = true;
} else {
containsOtherTask = true;
}
}
if (containsOtherTask && containsReleaseTask) {
var responseFailed = new TransactionPartFailedResponse();
responseFailed.Message = "At least one Task was not an ReleaseObjectTransactionTask.";
responseFailed.Uid = partUid;
callback(responseFailed);
return;
}
for (var k = 0; k < tasks.length; k++) {
var task = tasks[k];
var taskType = task.$type;
if (taskType === "Tricentis.Automation.Remoting.Transactions.Tasks.ReleaseObjectTransactionTask, Tricentis.Automation.Remoting") {
this.HandleReleaseObjectTransactionTask(task, targetObjectId, addToResponse);
return;
}
}
var targetObject = this.javaScriptServer.GetObject(targetObjectId);
if (targetObject == null)
throw "Object with Id " + targetObjectId + " not found";
for (var k = 0; k < tasks.length; k++) {
var task = tasks[k];
this.HandleTransactionTask(task, targetObject, transactionPart.TargetObject, checkTheResponse);
}
} catch(e) {
var responseFailed = self.FillFailedResponse(new TransactionPartFailedResponse(), "[RequestHandler.HandleTransactionPart]", e, partUid, transactionPart.TargetObject);
callback(responseFailed);
}
};
self.HandleTransactionTask = function (transactionTask, targetObject, objectId, callback) {
globalError = null;
try {
var transUid = transactionTask.Uid;
var taskType = transactionTask.$type;
if (taskType === "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeVoidMethodTransactionTask, Tricentis.Automation.Remoting") {
this.HandleInvokeVoidMethodTransactionTask(transactionTask, targetObject, objectId, callback);
}else if (taskType === "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsValueTransactionTask, Tricentis.Automation.Remoting") {
this.HandleInvokeMethodAsValueTransactionTask(transactionTask, targetObject, objectId, callback);
} else if (taskType === "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsReferenceTransactionTask, Tricentis.Automation.Remoting") {
this.HandleInvokeMethodAsReferenceTransactionTask(transactionTask, targetObject, objectId, callback);
} else if (taskType === "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsListTransactionTask, Tricentis.Automation.Remoting") {
this.HandleInvokeMethodAsListTransactionTask(transactionTask, targetObject, objectId, callback);
} else if (taskType === "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsValueTransactionTask, Tricentis.Automation.Remoting") {
this.HandleGetPropertyAsValueTransactionTask(transactionTask, targetObject, objectId, callback);
} else if (taskType === "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsListTransactionTask, Tricentis.Automation.Remoting") {
this.HandleGetPropertyAsListTransactionTask(transactionTask, targetObject, objectId, callback);
} else if (taskType === "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsReferenceTransactionTask, Tricentis.Automation.Remoting") {
this.HandleGetPropertyAsReferenceTransactionTask(transactionTask, targetObject, objectId, callback);
} else if (taskType === "Tricentis.Automation.Remoting.Transactions.Tasks.SetPropertyValueTransactionTask, Tricentis.Automation.Remoting") {
this.HandleSetPropertyTransactionTask(transactionTask, targetObject, objectId, callback);
} else {
var errMessage = "Task " + taskType + " not recognized.";
log(errMessage, LOG_SEV_ERROR);
var taskResponse = {};
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.TransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse.Message = errMessage;
taskResponse.Uid = transUid;
taskResponse.TargetObject = objectId;
callback(taskResponse);
return;
}
} catch (e) {
var responseFailed = {};
responseFailed.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.TransactionTaskFailedResponse, Tricentis.Automation.Remoting";
responseFailed = self.FillFailedResponse(responseFailed, "[RequestHandler.HandleTransactionTask]", e, transUid, objectId);
callback(responseFailed);
return;
}
if (globalError) {
var message = globalError;
globalError = null;
var responseFailed = {};
responseFailed.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.TransactionTaskFailedResponse, Tricentis.Automation.Remoting";
responseFailed = self.FillFailedResponseAlternative(responseFailed, "[RequestHandler.HandleTransactionTask]", message, transUid, objectId);
callback(responseFailed);
return;
}
};
self.HandleReleaseObjectTransactionTask = function(transactionTask, targetObjectId, callback) {
var transUid = transactionTask.Uid;
var taskResponse = {};
this.javaScriptServer.DeleteObject(targetObjectId);
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.ReleaseObjectTransactionTaskSuccessResponse, Tricentis.Automation.Remoting";
taskResponse.Uid = transUid;
callback(taskResponse);
};
self.HandleGetPropertyAsReferenceTransactionTask = function (transactionTask, targetObject, objectId, callback) {
var transUid = transactionTask.Uid;
var propertyName = transactionTask.PropertyName;
var returnObject;
var taskResponse = {};
try {
returnObject = self.reflection.getProperty(targetObject, propertyName);
if (self.reflection.GetType(returnObject) === "Error") {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsReferenceTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleGetPropertyAsReferenceTransactionTask]", returnObject, transUid, objectId);
callback(taskResponse);
return;
}
} catch(e) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsReferenceTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleGetPropertyAsReferenceTransactionTask]", e, transUid, objectId);
callback(taskResponse);
return;
}
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsReferenceTransactionTaskSuccessResponse, Tricentis.Automation.Remoting";
taskResponse.Uid = transUid;
taskResponse.Result = self.toTransactionObjectAsReference(returnObject);
callback(taskResponse);
};
self.HandleGetPropertyAsListTransactionTask = function (transactionTask, targetObject, objectId, callback) {
var transUid = transactionTask.Uid;
var propertyName = transactionTask.PropertyName;
var resultAsValue = transactionTask.ResultAsValue;
var returnObject;
var taskResponse = {};
try {
returnObject = self.reflection.getProperty(targetObject, propertyName);
if (self.reflection.GetType(returnObject) === "Error") {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsListTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleGetPropertyAsListTransactionTask]", returnObject, transUid, objectId);
callback(taskResponse);
return;
}
} catch(e) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsListTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleGetPropertyAsListTransactionTask]", e, transUid, objectId);
callback(taskResponse);
return;
}
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsListTransactionTaskSuccessResponse, Tricentis.Automation.Remoting";
taskResponse.Uid = transUid;
taskResponse.Result = self.toTransactionObjectAsList(returnObject, resultAsValue);
callback(taskResponse);
};
self.HandleGetPropertyAsValueTransactionTask = function (transactionTask, targetObject, objectId, callback) {
var transUid = transactionTask.Uid;
var propertyName = transactionTask.PropertyName;
var returnObject;
var taskResponse = {};
try {
returnObject = self.reflection.getProperty(targetObject, propertyName);
if (self.reflection.GetType(returnObject) === "Error") {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsValueTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleGetPropertyAsValueTransactionTask]", returnObject, transUid, objectId);
callback(taskResponse);
return;
}
} catch(e) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsValueTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleGetPropertyAsValueTransactionTask]", e, transUid, objectId);
callback(taskResponse);
return;
}
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.GetPropertyAsValueTransactionTaskSuccessResponse, Tricentis.Automation.Remoting";
taskResponse.Uid = transUid;
taskResponse.PropertyValue = self.toTransactionObjectAsValue(returnObject);
callback(taskResponse);
};
self.HandleSetPropertyTransactionTask = function (transactionTask, targetObject, objectId, callback) {
var transUid = transactionTask.Uid;
var propertyName = transactionTask.PropertyName;
var newPropertyValue = transactionTask.PropertyValue;
var valueToSet = this.ExtractValue(newPropertyValue);
var returnObject;
var taskResponse = {};
try {
self.reflection.setProperty(targetObject, propertyName, valueToSet);
returnObject = self.reflection.getProperty(targetObject, propertyName);
if (self.reflection.GetType(returnObject) === "Error") {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.SetPropertyValueTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleSetPropertyTransactionTask]", returnObject, transUid, objectId);
callback(taskResponse);
return;
}
} catch(e) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.SetPropertyValueTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleSetPropertyTransactionTask]", e, transUid, objectId);
callback(taskResponse);
return;
}
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.SetPropertyValueTransactionTaskSuccessResponse, Tricentis.Automation.Remoting";
taskResponse.Uid = transUid;
taskResponse.PropertyValue = self.toTransactionObjectAsReference(returnObject);
callback(taskResponse);
};
self.HandleInvokeVoidMethodTransactionTask = function (transactionTask, targetObject, objectId, callback) {
var transUid = transactionTask.Uid;
var methodName = transactionTask.MethodName;
var parameters = transactionTask.Parameters;
var waitForResult = transactionTask.WaitForResult;
var params = this.ExtractValues(parameters);
var taskResponse = {};
var handler = this;
try {
if (waitForResult) {
self.invokeVoidMethod(targetObject, methodName, params, transUid, objectId, handler, callback);
} else {
setTimeout(function() {
self.invokeVoidMethod(targetObject, methodName, params, transUid, objectId, handler, function(taskResponse) { /*Do nothing as we dont care for the result*/ });
}, 0);
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeVoidMethodTransactionTaskSuccessResponse, Tricentis.Automation.Remoting";
taskResponse.Uid = transUid;
callback(taskResponse);
}
} catch (e) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeVoidMethodTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleInvokeVoidMethodTransactionTask]", e, transUid, objectId);
callback(taskResponse);
return;
}
};
self.invokeVoidMethod = function (targetObject, methodName, params, transUid, objectId, handler, callback) {
var taskResponse = {};
self.reflection.invokeMethod(targetObject, methodName, params, function (returnObject) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeVoidMethodTransactionTaskSuccessResponse, Tricentis.Automation.Remoting";
taskResponse.Uid = transUid;
if (self.reflection.GetType(returnObject) === "Error") {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeVoidMethodTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleInvokeVoidMethodTransactionTask]", returnObject, transUid, objectId);
callback(taskResponse);
return;
}
taskResponse.Result = handler.toTransactionObjectAsValue(returnObject);
callback(taskResponse);
});
};
self.HandleInvokeMethodAsValueTransactionTask = function (transactionTask, targetObject, objectId, callback) {
var transUid = transactionTask.Uid;
var methodName = transactionTask.MethodName;
var parameters = transactionTask.Parameters;
var params = this.ExtractValues(parameters);
var taskResponse = {};
var handler = this;
try {
self.reflection.invokeMethod(targetObject, methodName, params, function(returnObject) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsValueTransactionTaskSuccessResponse, Tricentis.Automation.Remoting";
taskResponse.Uid = transUid;
if (self.reflection.GetType(returnObject) === "Error") {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsValueTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleInvokeMethodAsValueTransactionTask]", returnObject, transUid, objectId);
callback(taskResponse);
return;
}
taskResponse.Result = handler.toTransactionObjectAsValue(returnObject);
callback(taskResponse);
});
} catch(e) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsValueTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleInvokeMethodAsValueTransactionTask]", e, transUid, objectId);
callback(taskResponse);
return;
}
};
self.HandleInvokeMethodAsReferenceTransactionTask = function (transactionTask, targetObject, objectId, callback) {
var transUid = transactionTask.Uid;
var methodName = transactionTask.MethodName;
var parameters = transactionTask.Parameters;
var params = this.ExtractValues(parameters);
var taskResponse = {};
var handler = this;
try {
self.reflection.invokeMethod(targetObject, methodName, params, function(returnObject) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsReferenceTransactionTaskSuccessResponse, Tricentis.Automation.Remoting";
taskResponse.Uid = transUid;
if (self.reflection.GetType(returnObject) === "Error") {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsReferenceTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleInvokeMethodAsReferenceTransactionTask]", returnObject, transUid, objectId);
callback(taskResponse);
return;
}
taskResponse.Result = handler.toTransactionObjectAsReference(returnObject);
callback(taskResponse);
});
} catch(e) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsReferenceTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleInvokeMethodAsReferenceTransactionTask]", e, transUid, objectId);
callback(taskResponse);
return;
}
};
self.HandleInvokeMethodAsListTransactionTask = function (transactionTask, targetObject, objectId, callback) {
var transUid = transactionTask.Uid;
var methodName = transactionTask.MethodName;
var parameters = transactionTask.Parameters;
var resultAsValue = transactionTask.ResultAsValue;
var params = this.ExtractValues(parameters);
var taskResponse = {};
var handler = this;
try {
self.reflection.invokeMethod(targetObject, methodName, params, function(returnObject) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsListTransactionTaskSuccessResponse, Tricentis.Automation.Remoting";
taskResponse.Uid = transUid;
if (self.reflection.GetType(returnObject) === "Error") {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsListTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleInvokeMethodAsListTransactionTask]", returnObject, transUid, objectId);
callback(taskResponse);
return;
}
taskResponse.Result = handler.toTransactionObjectAsList(returnObject, resultAsValue);
callback(taskResponse);
});
} catch(e) {
taskResponse.$type = "Tricentis.Automation.Remoting.Transactions.Tasks.InvokeMethodAsListTransactionTaskFailedResponse, Tricentis.Automation.Remoting";
taskResponse = self.FillFailedResponse(taskResponse, "[RequestHandler.HandleInvokeMethodAsListTransactionTask]", e, transUid, objectId);
callback(taskResponse);
return;
}
};
self.toTransactionObjectAsValue = function(targetObject) {
var returnValue = {};
if (targetObject == null) {
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.NullValueTransactionValue, Tricentis.Automation.Remoting";
return returnValue;
}
var type = (typeof(targetObject)).toLowerCase();
if (type === "boolean") {
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.BoolTransactionValue, Tricentis.Automation.Remoting";
returnValue.Value = targetObject;
return returnValue;
}
if (type === "number") {
if (isNaN(targetObject)) {
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.NullValueTransactionValue, Tricentis.Automation.Remoting";
return returnValue;
}
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.DoubleTransactionValue, Tricentis.Automation.Remoting";
returnValue.Value = targetObject;
return returnValue;
}
if (type === "string") {
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.StringTransactionValue, Tricentis.Automation.Remoting";
returnValue.Charset = CURRENT_ENCODING;
var replaced = targetObject.replace(/(\r\n|\n|\r)/gm, "\r\n");
returnValue.B64Value = self.Base64.utf8_to_b64(replaced);
return returnValue;
}
if (type === "function") {
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.NullValueTransactionValue, Tricentis.Automation.Remoting";
return returnValue;
}
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.StringTransactionValue, Tricentis.Automation.Remoting";
returnValue.Charset = CURRENT_ENCODING;
returnValue.B64Value = self.Base64.utf8_to_b64(targetObject);
return returnValue;
};
self.toTransactionObjectAsReference = function(targetObject) {
var returnValue = {};
if (targetObject == null) {
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.NullReferenceTransactionValue, Tricentis.Automation.Remoting";
return returnValue;
}
var typeName = self.reflection.GetType(targetObject);
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.ObjectTransactionValue, Tricentis.Automation.Remoting";
var targetObjectReferencesId = this.javaScriptServer.AddObject(targetObject);
returnValue.TypeName = TYPENAMEPREFIX + typeName;
returnValue.ObjectId = targetObjectReferencesId;
return returnValue;
};
self.toTransactionObjectAsList = function(targetObject, resultAsValue) {
var returnValue = {};
if (targetObject === null) {
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.NullReferenceTransactionValue, Tricentis.Automation.Remoting";
return returnValue;
}
var typeName = self.reflection.GetType(targetObject);
var isList = typeName === "NodeList" || typeName === "HTMLCollection" || typeName === "HTMLTableElementList" || typeName === "HTMLTableRowElementList" || typeName === "HTMLTableCellElementList";
if (!isList && !("length" in targetObject)) {
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.NullReferenceTransactionValue, Tricentis.Automation.Remoting";
return returnValue;
}
if (resultAsValue) {
return self.toTransactionObjectAsValueList(targetObject);
} else {
return self.toTransactionObjectAsReferenceList(targetObject);
}
};
self.toTransactionObjectAsReferenceList = function (targetObject) {
var returnValue = {};
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.OrderedReferenceTransactionValues, Tricentis.Automation.Remoting";
returnValue.Values = [];
//targetObject is a NodeList which is not a legal JavaScript object so we need to handle it differently
var resultObject;
if ("length" in targetObject) {
for (var i = 0; i < targetObject.length; ++i) {
resultObject = this.toTransactionObjectAsReference(targetObject[i]);
if (resultObject != null) {
returnValue.Values.push(resultObject);
}
}
} else {
for (var member in targetObject) {
resultObject = this.toTransactionObjectAsReference(targetObject[member]);
if (resultObject != null) {
returnValue.Values.push(resultObject);
}
}
}
return returnValue;
}
self.toTransactionObjectAsValueList = function (targetObject) {
var returnValue = {};
returnValue.$type = "Tricentis.Automation.Remoting.Transactions.Values.OrderedValueTransactionValues, Tricentis.Automation.Remoting";
returnValue.Values = [];
//targetObject is a NodeList which is not a legal JavaScript object so we need to handle it differently
var resultObject;
if ("length" in targetObject) {
for (var i = 0; i < targetObject.length; ++i) {
resultObject = this.toTransactionObjectAsValue(targetObject[i]);
if (resultObject != null) {
returnValue.Values.push(resultObject);
}
}
} else {
for (var member in targetObject) {
resultObject = this.toTransactionObjectAsValue(targetObject[member]);
if (resultObject != null) {
returnValue.Values.push(resultObject);
}
}
}
return returnValue;
}
self.ExtractValues = function(params) {
var result = [];
for (var k = 0; k < params.length; k++) {
var param = params[k];
var resultParam = this.ExtractValue(param);
result.push(resultParam);
}
return result;
};
self.ExtractValue = function(param) {
var typeName = param.$type;
if (typeName === "Tricentis.Automation.Remoting.Transactions.Values.FloatTransactionValue, Tricentis.Automation.Remoting") {
return parseFloat(param.Value);
}
if (typeName === "Tricentis.Automation.Remoting.Transactions.Values.DoubleTransactionValue, Tricentis.Automation.Remoting") {
return parseFloat(param.Value);
}
if (typeName === "Tricentis.Automation.Remoting.Transactions.Values.IntTransactionValue, Tricentis.Automation.Remoting") {
if (param.Size === 4) {
return parseInt(param.Value, 10);
}
if (param.Size === 8) {
return parseFloat(param.Value);
}
// Maximum whole number that can be represented in javascript is 2^53
throw ("IntTransactionValue.Size other than 4 or 8 is not supported. Current: " + param.Size);
}
if (typeName === "Tricentis.Automation.Remoting.Transactions.Values.StringTransactionValue, Tricentis.Automation.Remoting") {
return self.Base64.b64_to_utf8(param.B64Value);
}
if (typeName === "Tricentis.Automation.Remoting.Transactions.Values.NullValueTransactionValue, Tricentis.Automation.Remoting") {
return null;
}
if (typeName === "Tricentis.Automation.Remoting.Transactions.Values.NullReferenceTransactionValue, Tricentis.Automation.Remoting") {
return null;
}
if (typeName === "Tricentis.Automation.Remoting.Transactions.Values.BoolTransactionValue, Tricentis.Automation.Remoting") {
return (param.Value === true);
}
if (typeName === "Tricentis.Automation.Remoting.Transactions.Values.ByteArrayTransactionValue, Tricentis.Automation.Remoting") {
var byteB64 = param.BytesB64;
return self.Base64.b64_to_utf8(byteB64);
}
if (typeName === "Tricentis.Automation.Remoting.Transactions.Values.ObjectTransactionValue, Tricentis.Automation.Remoting") {
var objId = param.ObjectId;
return this.javaScriptServer.GetObject(objId);
}
};
self.HandleRequest = function (requestToHandle, callback) {
try {
this.HandleTransaction(requestToHandle, function (response) {
finalizeResponse(response, callback);
});
} catch (e) {
var responseFailed = self.FillFailedResponse(new TransactionFailedResponse(), "[RequestHandler.HandleRequest]", e, "");
finalizeResponse(responseFailed, callback);
return;
}
};
function finalizeResponse(response, callback)
{
response.Version = EXTENSION_VERSION;
callback(response);
}
self.Reset = function() {
this.WasAlreadyInstantiated = false;
self.Responses = new Array();
this.javaScriptServer.Reset();
};
}
//Transaction prototypes
function TransactionSuccessResponse() {
this.$type = "Tricentis.Automation.Remoting.Transactions.TransactionSuccessResponse, Tricentis.Automation.Remoting";
this.Uid = "";
this.Parts = [];
}
function TransactionFailedResponse() {
this.$type = "Tricentis.Automation.Remoting.Transactions.TransactionFailedResponse, Tricentis.Automation.Remoting";
this.Uid = "";
this.Parts = [];
this.Message = "";
}
function TransactionPartSuccessResponse() {
this.$type = "Tricentis.Automation.Remoting.Transactions.TransactionPartSuccessResponse, Tricentis.Automation.Remoting";
this.Uid = "";
this.Tasks = [];
}
function TransactionPartFailedResponse() {
this.$type = "Tricentis.Automation.Remoting.Transactions.TransactionPartFailedResponse, Tricentis.Automation.Remoting";
this.Uid = "";
this.Tasks = [];
this.Message = "";
}
function TypedException(type, exception) {
this.exception = exception;
this.type = type;
}
var LB = "\r\n";
/*
* base64.js - Base64 encoding and decoding functions
*
* See: http://developer.mozilla.org/en/docs/DOM:window.btoa
*      http://developer.mozilla.org/en/docs/DOM:window.atob
*
* Copyright (c) 2007, David Lindquist <david.lindquist@gmail.com>
* Released under the MIT license
*/
function Base64() {
var self = this;
var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
self.utf8_to_b64 = function(str) {
if (str.length === 0) {
return "";
}
if (window.btoa) {
return window.btoa(unescape(encodeURIComponent(str)));
}
return encode(str);
};
self.b64_to_utf8 = function(str) {
if (str.length === 0) {
return "";
}
if (window.atob) {
return decodeURIComponent(escape(window.atob(str)));
}
return decode(str);
};
/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
function encode(input) {
var output = "";
var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
var i = 0;
input = utf8Encode(input);
while (i < input.length) {
chr1 = input.charCodeAt(i++);
chr2 = input.charCodeAt(i++);
chr3 = input.charCodeAt(i++);
enc1 = chr1 >> 2;
enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
enc4 = chr3 & 63;
if (isNaN(chr2)) {
enc3 = enc4 = 64;
} else if (isNaN(chr3)) {
enc4 = 64;
}
output = output +
keyStr.charAt(enc1) + keyStr.charAt(enc2) +
keyStr.charAt(enc3) + keyStr.charAt(enc4);
}
return output;
};
// public method for decoding
function decode(input) {
var output = "";
var chr1, chr2, chr3;
var enc1, enc2, enc3, enc4;
var i = 0;
input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
while (i < input.length) {
enc1 = keyStr.indexOf(input.charAt(i++));
enc2 = keyStr.indexOf(input.charAt(i++));
enc3 = keyStr.indexOf(input.charAt(i++));
enc4 = keyStr.indexOf(input.charAt(i++));
chr1 = (enc1 << 2) | (enc2 >> 4);
chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
chr3 = ((enc3 & 3) << 6) | enc4;
output = output + String.fromCharCode(chr1);
if (enc3 !== 64) {
output = output + String.fromCharCode(chr2);
}
if (enc4 !== 64) {
output = output + String.fromCharCode(chr3);
}
}
output = utf8Decode(output);
return output;
};
// private method for UTF-8 encoding
function utf8Encode(string) {
var utftext = "";
for (var n = 0; n < string.length; n++) {
var c = string.charCodeAt(n);
if (c < 128) {
utftext += String.fromCharCode(c);
} else if ((c > 127) && (c < 2048)) {
utftext += String.fromCharCode((c >> 6) | 192);
utftext += String.fromCharCode((c & 63) | 128);
} else {
utftext += String.fromCharCode((c >> 12) | 224);
utftext += String.fromCharCode(((c >> 6) & 63) | 128);
utftext += String.fromCharCode((c & 63) | 128);
}
}
return utftext;
};
// private method for UTF-8 decoding
function utf8Decode(utftext) {
var string = "";
var i = 0;
var c = 0;
var c2 = 0;
var c3 = 0;
while (i < utftext.length) {
c = utftext.charCodeAt(i);
if (c < 128) {
string += String.fromCharCode(c);
i++;
} else if ((c > 191) && (c < 224)) {
c2 = utftext.charCodeAt(i + 1);
string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
i += 2;
} else {
c2 = utftext.charCodeAt(i + 1);
c3 = utftext.charCodeAt(i + 2);
string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
i += 3;
}
}
return string;
};
}
/**
* Use this function to log to the console.
*/
function log(msg, severity) {
SetActiveLogLevel();
if (severity <= ACTIVELOGLEVEL) {
if (window.console) {
if (window.console.log) {
var wname = "";
if (window.name != "")
wname = " (" + window.name + ")";
window.console.log("[" + severity + "]: " + wname + msg + "\r\n");
}
}
}
}
function SetActiveLogLevel() {
if (ACTIVELOGLEVEL == undefined) {
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_FF) {
var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
.getService(Components.interfaces.nsIPrefBranch);
ACTIVELOGLEVEL = prefManager.getIntPref("extensions.toscaExt.defaultLogLevel");
}
else if (CURRENT_BROWSER === TOSCA_BROWSER_ID_FFWEB) {
if (typeof(browser) === typeof(undefined)) {
ACTIVELOGLEVEL = LOG_SEV_ERROR;
return;
}
var sendMessagePromise = browser.runtime.sendMessage({ method: "getLogLevel" });
sendMessagePromise.then(function (response) {
ACTIVELOGLEVEL = response.logLevel;
localStorage["logLevel"] = response.logLevel;
});
}
else if (CURRENT_BROWSER === TOSCA_BROWSER_ID_Chrome ||
CURRENT_BROWSER === TOSCA_BROWSER_ID_Mobile ||
CURRENT_BROWSER === TOSCA_BROWSER_ID_Mobile30 ||
CURRENT_BROWSER === TOSCA_BROWSER_ID_Safari) {
if (typeof (chrome) === typeof (undefined) || typeof (chrome.runtime) === typeof (undefined)) {
ACTIVELOGLEVEL = LOG_SEV_ERROR;
return;
}
chrome.runtime.sendMessage({ method: "getLogLevel" }, function (response) {
ACTIVELOGLEVEL = response.logLevel;
localStorage["logLevel"] = response.logLevel;
});
} else if (CURRENT_BROWSER === TOSCA_BROWSER_ID_Edge || CURRENT_BROWSER === TOSCA_BROWSER_ID_EdgeChromium) {
if (typeof(browser) === typeof(undefined) || typeof(browser.runtime) === typeof(undefined)) {
ACTIVELOGLEVEL = LOG_SEV_ERROR;
return;
}
browser.runtime.sendMessage({ method: "getLogLevel" }, function (response) {
ACTIVELOGLEVEL = response.logLevel;
localStorage["logLevel"] = response.logLevel;
});
} else if (CURRENT_BROWSER === TOSCA_BROWSER_ID_IE) {
//TODO: Setting?
ACTIVELOGLEVEL = LOG_SEV_ERROR;
} else if (typeof (ACTIVELOGLEVEL) === "undefined") {
ACTIVELOGLEVEL = LOG_SEV_ERROR;
}
}
}
//severity levels used for log(msg, severity)
LOG_SEV_DEBUG = 3;
LOG_SEV_INFO = 2;
LOG_SEV_WARN = 1;
LOG_SEV_ERROR = 0;
var ACTIVELOGLEVEL;
function CommonEntryPoint() {
var self = this;
CommonEntryPoint(self, window);
}
function CommonEntryPoint(entryPoint, currentWindow) {
var self;
var documentNodeType = 9;
if (!entryPoint) {
self = this;
} else {
self = entryPoint;
}
if (!currentWindow) {
currentWindow = window;
}
var chromeAvailable = false;
try {
chromeAvailable = typeof(chrome) !== typeof(undefined);
} catch (e) {
chromeAvailable = false;
}
var browserAvailable = false;
try {
browserAvailable = typeof(browser) !== typeof(undefined);
} catch (e) {
browserAvailable = false;
}
if (chromeAvailable && CURRENT_BROWSER === TOSCA_BROWSER_ID_Chrome) {
self.browserApiToUse = chrome;
} else if (browserAvailable && (CURRENT_BROWSER === TOSCA_BROWSER_ID_FFWEB || CURRENT_BROWSER === TOSCA_BROWSER_ID_Edge || CURRENT_BROWSER === TOSCA_BROWSER_ID_EdgeChromium)) {
self.browserApiToUse = browser;
} else {
self.browserApiToUse = undefined;
}
if (IsSapUI5Page(window)) {
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_IE) {
new sapUi5().InitializeSapUi5();
} else {
injectScript("Resources/sapui5.js", "new sapUi5().InitializeSapUi5();");
}
}
if ((CURRENT_BROWSER !== TOSCA_BROWSER_ID_IE) && (CURRENT_BROWSER !== TOSCA_BROWSER_ID_Edge) && document.querySelector("body.sfdcBody, body.ApexCSIPage, #auraLoadingBox")) {
self.getSfSession = function (sfHost) {
chrome.runtime.sendMessage({ message: "getSfSession", sfHost: sfHost },
function(sessionId) {
if (sessionId) {
var sfApiVersion =
self.GetJavaScriptResult(
"return typeof($A) !== 'undefined' ? $A.getContext().getCurrentAction().getStorage().getVersion() : null");
self.SfApiData = sfHost +
";" +
sessionId +
";" +
(sfApiVersion === "null" ? "default" : sfApiVersion);
}
}
);
};
self.getSfApiData = function() {
chrome.runtime.sendMessage({ message: "getSfDomain" },
function(data) {
self.getSfSession(data);
});
};
self.getSfApiData();
}
var reflection = new Reflection();
if (CURRENT_BROWSER !== TOSCA_BROWSER_ID_Mobile && CURRENT_BROWSER !== TOSCA_BROWSER_ID_Mobile30) {
var tracer = new AjaxTracer(currentWindow, CURRENT_BROWSER === TOSCA_BROWSER_ID_IE);
if (typeof(self.browserApiToUse) === typeof(undefined) || typeof(self.browserApiToUse.extension) === typeof(undefined) || CURRENT_BROWSER === TOSCA_BROWSER_ID_IE || CURRENT_BROWSER === TOSCA_BROWSER_ID_FF) {
tracer.startTracing();
} else {
injectScript("Resources/ajaxTracer.js", "var tracer = new AjaxTracer(window, false); tracer.startTracing();");
}
}
function injectScript(resourcePath, initCode) {
var script = self.browserApiToUse.extension.getURL(resourcePath);
var el = currentWindow.document.createElement('script');
el.src = script;
el.onload = function () {
var loadScript = currentWindow.document.createElement('script');
loadScript.innerHTML = initCode;
currentWindow.document.head.appendChild(loadScript);
};
currentWindow.document.head.appendChild(el);
}
self.assignAssociatedLabels = function(document) {
var labels = document.getElementsByTagName("LABEL");
for (var i = 0; i < labels.length; i++) {
var curLabel = labels[i];
if (curLabel.htmlFor === undefined || curLabel.htmlFor === "") {
continue;
}
var element = document.getElementById(curLabel.htmlFor);
if (element && curLabel.ownerDocument === element.ownerDocument) {
element.ToscaAssociatedLabel = curLabel;
}
}
var allElements = document.getElementsByTagName("*");
for (var k = 0; k < allElements.length; k++) {
var curElement = allElements[k];
if (curElement.ToscaAssociatedLabel === undefined) {
curElement.ToscaAssociatedLabel = null;
}
}
var myWindow = document.defaultView || document.parentWindow;
for (var j = 0; j < myWindow.frames.length; j++) {
try {
self.assignAssociatedLabels(myWindow.frames[j].document);
} catch (e) {
//Probably because of a cross-domain access violation
}
}
}
self.ExecuteJavaScript = function (javaScript) {
self.ExecuteJavaScriptInDocument(currentWindow.document, javaScript);
};
self.ExecuteJavaScriptInDocument = function (document, javaScript) {
var source = document.createElement("script");
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_IE) {
source.text = javaScript;
} else {
source.innerHTML = javaScript;
}
var head = document.head;
if (head == null) {
head = document.getElementsByTagName("head")[0];
}
head.appendChild(source);
head.removeChild(source);
};
self.FireEvent = function (htmlelement, eventName) {
var ownerDocument = htmlelement.ownerDocument;
var event = ownerDocument.createEvent("HTMLEvents");
event.initEvent(eventName, true, true);
htmlelement.dispatchEvent(event);
};
self.FireEvent = function(htmlelement, eventName, fireEventMethod) {
var ownerDocument = htmlelement.ownerDocument;
if (!fireEventMethod) {
if (ownerDocument.createEvent)
fireEventMethod = "DispatchEvent";
else
fireEventMethod = "FireEvent";
}
var fireEventMethods = fireEventMethod.split(/[;\+]/);
for (var i = 0; i < fireEventMethods.length; i++) {
var method = fireEventMethods[i];
var event;
if (method === "DispatchEvent") {
if (htmlelement.dispatchEvent) {
event = ownerDocument.createEvent("HTMLEvents");
event.initEvent(eventName, true, true);
htmlelement.dispatchEvent(event);
}
} else if (method === "FireEvent") {
if (ownerDocument.createEventObject) {
event = ownerDocument.createEventObject();
try {
htmlelement.fireEvent("on" + eventName, event);
} catch (e) {
// IE 7 & 8 Error
if (e.message === "Invalid argument.") {
throw "Error: Invalid FireEvent '" + eventName + "'. This event is not supported on this element for this specific Internet Explorer Version.";
} else {
throw e;
}
}
}
} else {
throw "Error: Invalid FireEventMethodIE value: " + method;
}
}
};
self.GetAllVisibleElements = function (element) {
if (element.getElementsByTagName === undefined) {
return getVisibleElements(element.querySelectorAll("*"));
}
return getVisibleElements(element.getElementsByTagName("*"));
};
self.getAssociatedLabel = function(element) {
if (element.ToscaAssociatedLabel !== undefined) {
return element.ToscaAssociatedLabel;
}
if (element.id === undefined || element.id === "") {
element.ToscaAssociatedLabel = null;
return element.ToscaAssociatedLabel;
}
self.assignAssociatedLabels(element.ownerDocument);
return element.ToscaAssociatedLabel;
};
self.GetAttributes = function(element) {
var attributes = element.attributes;
if (attributes === undefined || attributes === null) {
return JSON.stringify(new Array(0));
}
var validAttributesCount = 0;
for (var j = 0; j < attributes.length; j++) {
var cur = attributes[j];
if (cur !== undefined && cur !== null && cur.specified === true) {
validAttributesCount++;
}
}
var attributeStrings = new Array(validAttributesCount);
var lastIndex = 0;
for (var i = 0; i < attributes.length; i++) {
var attr = attributes[i];
if (attr === undefined || attr === null || !attr.specified) {
continue;
}
var attributeName = attr.nodeName === undefined || attr.nodeName === null ? "" : attr.nodeName.toString()
var attributeValue = attr.nodeValue === undefined || attr.nodeValue === null ? "" : attr.nodeValue.toString();
attributeStrings[lastIndex] =
{
name: attributeName,
value: attributeValue
};
lastIndex++;
}
return JSON.stringify(attributeStrings);
};
self.GetStyle = function (element, styleName) {
if (!styleName) {
return null;
}
var currentStyle = self.GetCurrentStyle(element);
return currentStyle.getPropertyValue(styleName);
}
self.GetStyles = function (element) {
var currentStyle = self.GetCurrentStyle(element);
if (currentStyle === undefined || currentStyle === null) {
return JSON.stringify(new Array(0));
}
var validStylesCount = 0;
for (var j = 0; j < currentStyle.length; j++) {
var cur = currentStyle[j];
if (cur !== undefined && cur !== null) {
validStylesCount++;
}
}
var stylesString = new Array(validStylesCount);
var lastIndex = 0;
for (var i = 0; i < currentStyle.length; i++) {
var style = currentStyle[i];
if (style === undefined || style === null) {
continue;
}
var styleValue = currentStyle.getPropertyValue(style);
stylesString[lastIndex] =
{
name: style,
value: styleValue
};
lastIndex++;
}
return JSON.stringify(stylesString);
};
self.GetContentDocument = function(frameElement) {
return frameElement.contentWindow.document;
};
self.GetCurrentStyle = function(htmlelement) {
var ownerDocument = htmlelement.ownerDocument;
var usedView = ownerDocument.defaultView;
//workaround for oddities in IE9 Quirks Mode
try {
if (usedView) {
return usedView.getComputedStyle(htmlelement, null);
}
return currentWindow.getComputedStyle(htmlelement, null);
} catch(e) {
return htmlelement.currentStyle;
}
};
self.GetDocument = function () {
self.tagWithAutomatedProperty();
return currentWindow.document;
};
self.GetDocumentFromBrowser = function(title) {
return currentWindow.document;
};
self.GetDocumentTitle = function() {
return currentWindow.document.title;
};
self.GetElementBorderWidths = function(element) {
var cStyle = currentWindow.getComputedStyle
? self.GetCurrentStyle(element)
: element.currentStyle;
return GetElementBorderWidthsInternal(cStyle);
};
self.getElementsByClassName = function(className) {
var result = [];
var allElements = document.getElementsByTagName("*");
for (var i = 0; i < allElements.length; i++) {
var obj = allElements[i];
if (obj.className === className) {
result.push(obj);
}
}
return result;
}
self.GetFrameElementForDocument = function (document) {
var window = document.defaultView;
if (!window) {
return null;
}
return window.frameElement;
};
self.GetFrameIndex = function (frame) {
var allFrames = getAllFrames();
for (var i = 0; i < allFrames.length; i++) {
if (frame === allFrames[i]) {
return i;
}
}
throw "Frame could not be found in HTML Document";
};
self.GetFrameWithIndex = function(index) {
var allFrames = getAllFrames();
return allFrames[index];
};
self.GetJavaScriptResult = function (functionBody) {
var mainDocument = currentWindow.document;
return self.GetJavaScriptResultInDocument(mainDocument, functionBody);
};
self.GetJavaScriptResultInDocument = function (document, javaScript) {
self.ExecuteJavaScriptInDocument(document, 'document.documentElement.setAttribute(\'TOSCA_SCRIPT_RESULT\', String((function(){' + javaScript + '})()));');
var result = document.documentElement.getAttribute('TOSCA_SCRIPT_RESULT');
document.documentElement.removeAttribute('TOSCA_SCRIPT_RESULT');
return result;
};
self.GetXPathResult = function(htmlDocument, xpath) {
var result = [];
var xpathResultSet = htmlDocument.evaluate(xpath, htmlDocument, null, 4, null);
if (xpathResultSet == null) {
return result;
}
var thisResult = xpathResultSet.iterateNext();
while (thisResult) {
result.push(thisResult);
thisResult = xpathResultSet.iterateNext();
}
return result;
}
self.GetScreenShot = function(htmlDocument, callback) {
currentWindow.html2canvas(htmlDocument.body, {
onrendered: function(canvas) {
var screenshot = canvas.toDataURL();
callback(screenshot);
}
});
return AsyncMethod;
};
self.GetScreenX = function() {
var borderWidth = (currentWindow.outerWidth - currentWindow.innerWidth) / 2;
var absX = currentWindow.screenLeft + borderWidth;
return absX;
};
self.GetScreenY = function() {
var borderWidth = (currentWindow.outerWidth - currentWindow.innerWidth) / 2;
var absY = (currentWindow.outerHeight - currentWindow.innerHeight - borderWidth) + currentWindow.screenTop;
return absY;
};
self.GetSerializedBoundingClientRect = function (obj) {
var rect;
try {
rect = obj.getBoundingClientRect();
} catch (e) {
rect = {
"top": 0,
"left": 0,
"bottom": 0,
"right": 0
}
}
return getSerializedRect(rect);
}
self.GetSerializedDocumentRect = function () {
var rect = {
"y": self.GetScreenY(),
"x": self.GetScreenX(),
"width": currentWindow.innerWidth,
"height": currentWindow.innerHeight
}
return JSON.stringify(rect);
}
function getSerializedRect(rect) {
var top;
var left;
var width;
var height;
try {
top = rect.top;
left = rect.left;
width = rect.right - rect.left;
height = rect.bottom - rect.top;
} catch (e) {
top = 0;
left = 0;
width = 0;
height = 0;
}
// Stringify ignores not owned Properties of clientRect
var rectObject = {
"y": top,
"x": left,
"width": width,
"height": height
}
return JSON.stringify(rectObject);
}
self.GetSerializedClientRects = function (obj) {
var serializedClientRects = [];
var clientRects = obj.getClientRects();
for (var i = 0; i < clientRects.length; i++) {
serializedClientRects.push(getSerializedRect(clientRects[i]));
}
return serializedClientRects;
}
self.GetTechnicalTypeOfInstance = function (obj) {
return new TechnicalTypeInfo(obj);
};
self.GetVisibleChildren = function(element) {
return getVisibleElements(element.childNodes);
}
function getVisibleElements(allElements) {
var visibleElements = new Array();
for (var i = 0; i < allElements.length; i++) {
var possibleElement = allElements[i];
if (self.IsVisible(possibleElement)) {
visibleElements.push(possibleElement);
}
}
return visibleElements;
}
self.GetVisibleParentNode = function(element) {
var parent = element.parentNode;
while (parent !== undefined && parent !== null) {
if (parent.nodeType === documentNodeType) {
return parent;
}
if (self.IsVisible(parent)) {
return parent;
}
parent = parent.parentNode;
}
return null;
}
self.GetXPathFromElement = function (element) {
var myDocument = self.GetDocument();
var allNodes = myDocument.getElementsByTagName("*");
var xpathSegments = [];
for (xpathSegments; element && element.nodeType === 1; element = element.parentNode) {
if (element.id !== "") {
var uniqueIdCount = 0;
for (var n = 0; n < allNodes.length; n++) {
if (allNodes[n].id !== "" && allNodes[n].id === element.id) uniqueIdCount++;
if (uniqueIdCount > 1) break;
};
if (uniqueIdCount === 1) {
xpathSegments.unshift("id(\'" + element.id + "\')");
return xpathSegments.join("/");
} else {
var parent = element.parentNode;
var index = 1;
if (parent !== null && parent !== undefined) {
for (var childindex = 0; childindex < parent.childNodes.length; childindex++) {
var childNode = parent.childNodes[childindex];
if (childNode === element) break;
if (childNode.id !== "" && childNode.id === element.id) index++;
}
}
xpathSegments.unshift(element.nodeName.toLowerCase()
+ "[@id=\'" + element.id + "\']"
+ "[" + index + "]");
}
} else {
var i = 1;
for (var sib = element.previousSibling; sib; sib = sib.previousSibling) {
if (sib.nodeName === element.nodeName) i++;
};
xpathSegments.unshift(element.nodeName.toLowerCase() + "[" + i + "]");
};
};
return xpathSegments.length ? "/" + xpathSegments.join("/") : null;
};
self.HasOpenRequests = function () {
return tracer.hasOpenRequests();
};
self.InstallXPathLibrary = function () {
if (!document.evaluate) {
wgxpath.install();
}
};
self.IsInViewPort = function (htmlElement) {
var top = htmlElement.offsetTop;
var left = htmlElement.offsetLeft;
var width = htmlElement.offsetWidth;
var height = htmlElement.offsetHeight;
while (htmlElement.offsetParent) {
htmlElement = htmlElement.offsetParent;
top += htmlElement.offsetTop;
left += htmlElement.offsetLeft;
}
return (top >= currentWindow.pageYOffset && left >= currentWindow.pageXOffset && (top + height) <= (currentWindow.pageYOffset + currentWindow.innerHeight) && (left + width) <= (currentWindow.pageXOffset + currentWindow.innerWidth));
};
self.IsVisible = function(element) {
if (reflection.GetHtmlType(element).toUpperCase() === "OPTION") {
return self.IsStyleVisible(element);
}
var rect;
try {
rect = element.getBoundingClientRect();
} catch (e) {
return self.IsStyleVisible(element);
}
if (((rect.bottom - rect.top) < 1) && ((rect.right - rect.left) < 1)) {
return false;
}
return self.IsStyleVisible(element);
};
self.IsStyleVisible = function (element) {
var style = self.GetCurrentStyle(element);
if (style == undefined) {
return true;
}
return style.display !== "none" && style.visibility !== "hidden" && style.visibility !== "collapse";
};
self.MapExtensionMethods = function (element) {
if ((element.ExtRegistered !== undefined || element.nodeType === undefined) && !isEmbeddedIEInEdge(element)) {
return;
}
if (isJavaApplet(element)) {
return;
}
try {
element.ExtRegistered = true;
} catch (e) {
// happens with IE5 when special treated nodes are received like onchange or #text
return;
}
var elementType = reflection.GetHtmlType(element).toUpperCase();
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_Edge) {
if (elementType === "FORM" || elementType === "SELECT") {
return;
}
}
element.GetTechnicalTypeOfInstance = function() { return self.GetTechnicalTypeOfInstance(this); };
if (element.nodeType === documentNodeType && CURRENT_BROWSER !== TOSCA_BROWSER_ID_Mobile && CURRENT_BROWSER !== TOSCA_BROWSER_ID_Mobile30) {
//it's a document
element.ScrollBy = function(offsetX, offsetY) { return self.ScrollBy(this, offsetX, offsetY); };
element.GetScreenShot = function (callback) { return self.GetScreenShot(this, callback); };
element.GetXPathResult = function (xpath) { return  self.GetXPathResult(this, xpath); };
element.GetAllVisibleElements = function() { return self.GetAllVisibleElements(this); };
element.GetVisibleChildren = function() { return self.GetVisibleChildren(this); };
// IE 5-8 does not have a getElementsByClassName.
if (element.getElementsByClassName == undefined) {
element.getElementsByClassName = self.getElementsByClassName;
}
return;
}
element.FireEvent = function(eventName, fireEventMethod) { self.FireEvent(this, eventName, fireEventMethod); };
element.GetAssociatedLabel = function () { return self.getAssociatedLabel(this); };
element.GetCurrentStyle = function() { return self.GetCurrentStyle(this); };
element.GetElementBorderWidths = function () { return self.GetElementBorderWidths(this); };
element.GetStyle = function (styleName) { return self.GetStyle(this, styleName); };
element.GetStyles = function () { return self.GetStyles(this); };
element.GetSerializedBoundingClientRect = function () { return self.GetSerializedBoundingClientRect(this); };
element.GetSerializedClientRects = function () { return self.GetSerializedClientRects(this); };
element.IsInViewPort = function() { return self.IsInViewPort(this); };
element.IsVisible = function() { return self.IsVisible(this); };
element.MouseEvent = function (eventType, sX, sY, cX, cY) { self.MouseEvent(this, eventType, sX, sY, cX, cY); };
element.ScrollInADiv = function (x, y) { return self.ScrollInADiv(this, x, y); };
element.ScrollIntoView = function (position) { return self.ScrollTo(this, position); };
element.ScrollToCenter = function () { return self.ScrollToCenter(this); };
element.GetAllVisibleElements = function() { return self.GetAllVisibleElements(this); };
element.GetVisibleChildren = function() { return self.GetVisibleChildren(this); };
element.GetVisibleParentNode = function() { return self.GetVisibleParentNode(this); };
element.GetAttributes = function () { return self.GetAttributes(this); };
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_Mobile || CURRENT_BROWSER === TOSCA_BROWSER_ID_Mobile30) {
MobileMapExtensionMethods(element, self);
}
if (elementType === "FRAME" || elementType === "IFRAME") {
element.IsCrossDomainFrame = function () { return self.IsCrossDomainFrame(this); }
}
};
self.MarkControlOnScreen = function (width, height, left, top) {
var myDoc = self.GetDocument();
var div = myDoc.createElement('div');
div.id = 'ToscaJavaScriptHighlightID';
div.style.width = width + 'px';
div.style.height = height + 'px';
div.style.position = 'fixed';
div.style.left = left + 'px';
div.style.top = top + 'px';
div.style.zIndex = '99999';
div.style.opacity = '0.5';
div.style.backgroundColor = 'red';
var body = myDoc.body;
if(body == null) {
body = myDoc.getElementsByTagName('body')[0];
}
body.appendChild(div);
setTimeout(RemoveMarking, 1000);
function RemoveMarking() {
var myDoc = self.GetDocument();
var body = myDoc.body;
if(body == null) {
body = myDoc.getElementsByTagName('body')[0];
}
body.removeChild(document.getElementById('ToscaJavaScriptHighlightID'));
};
};
self.MouseEvent = function (htmlelement, eventType, sX, sY, cX, cY) {
var event;
try {
event = new MouseEvent(eventType, { bubbles: true, cancelable: (eventType !== "mousemove"), view: currentWindow, detail: det, screenX: sX, screenY: sY, clientX: cX, clientY: cY });
} catch (e) {
log("Could not create MouseEvent by constructor. Trying other possibilities: " + e.message, LOG_SEV_DEBUG);
}
if(!event){
var ownerDocument = htmlelement.ownerDocument;
if (ownerDocument.createEvent) {
event = ownerDocument.createEvent("MouseEvents");
var det = ((eventType === "click") ? 1 : 0);
event.initMouseEvent(eventType, true, (eventType !== "mousemove"), currentWindow, det, sX, sY, cX, cY, false, false, false, false, 0, null);
} else if (ownerDocument.createEventObject) {
event = ownerDocument.createEventObject();
event.clientX = cX;
event.clientY = cY;
event.screenX = sX;
event.screenY = sY;
event.type = eventType;
} else{
return;
}
}
if (htmlelement.dispatchEvent) {
htmlelement.dispatchEvent(event);
} else if (htmlelement.fireEvent) {
htmlelement.fireEvent("on" + eventType, event);
}
}
self.ScrollBy = function(htmlDocument, offsetX, offsetY) {
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_Mobile || CURRENT_BROWSER === TOSCA_BROWSER_ID_Mobile30) {
var usedView = htmlDocument.defaultView;
usedView.scrollBy(offsetX, offsetY);
} else {
self.ExecuteJavaScriptInDocument(htmlDocument, "window.scrollBy(" + offsetX + ", " + offsetY + ");");
}
};
self.ScrollInADiv = function (htmlElement, x, y) {
htmlElement.scrollLeft += x;
htmlElement.scrollTop += y;
};
self.ScrollTo = function (htmlElement, position) {
if (htmlElement.scrollIntoView !== undefined) {
htmlElement.scrollIntoView(position);
} else {
var elementRect = htmlElement.getBoundingClientRect();
var centerX = elementRect.left + (elementRect.right - elementRect.left) / 2;
var centerY = elementRect.top + (elementRect.top - elementRect.bottom) / 2;
currentWindow.scrollTo(centerX, centerY);
}
};
self.ScrollToCenter = function (htmlElement) {
var parentElement = htmlElement.parentElement;
while (parentElement !== undefined && parentElement !== null && parentElement.tagName !== "HTML") {
// if the parent has a scrollbar then scroll it
if (parentElement.clientHeight < parentElement.scrollHeight || parentElement.clientWidth < parentElement.scrollWidth) {
var elementBoundingRect = htmlElement.getBoundingClientRect();
var parentBoundingRect = parentElement.getBoundingClientRect();
var scrollX = elementBoundingRect.left + (elementBoundingRect.width/2) - parentBoundingRect.left - (parentBoundingRect.width/2);
var scrollY = elementBoundingRect.top + (elementBoundingRect.height/2) - parentBoundingRect.top - (parentBoundingRect.height/2);
self.ScrollInADiv(parentElement, scrollX, scrollY);
}
parentElement = parentElement.parentElement;
}
};
self.SetExitMessage = function(message) {
if (message === "") {
currentWindow.onbeforeunload = null;
self.disableAutomatedProperty();
return;
}
currentWindow.onbeforeunload = function() {
return message;
};
};
self.tagWithAutomatedProperty = function () {
self.ExecuteJavaScript('document.isAutomatedByTosca = \'True\';');
}
self.disableAutomatedProperty = function () {
self.ExecuteJavaScript('document.isAutomatedByTosca = \'False\';');
}
self.IsCrossDomainFrame = function (frame) {
var html = null;
try {
var doc = frame.contentDocument || frame.contentWindow.document;
html = doc.body.innerHTML;
} catch (err) {
// do nothing
}
return (html === null);
}
function resetAllSearchedFrames(myWindow, callback) {
myWindow.postMessage("ResetSearchedFrame", "*");
for (var i = 0; i < myWindow.frames.length; i++) {
resetAllSearchedFrames(myWindow.frames[i]);
}
if (myWindow !== window.top) {
return;
}
if (chromeAvailable === true) {
chrome.runtime.sendMessage({ method: "waitForAllFramesToReset" },
function(response) {
log("Reseting all searched frames. Done", LOG_SEV_DEBUG);
callback();
});
}
}
function setAndCheckSearchedFrame(frame, callback) {
frame.contentWindow.postMessage("SetSearchedFrame", "*");
log("Checking which frame is searched", LOG_SEV_DEBUG);
if (chromeAvailable === true) {
chrome.runtime.sendMessage({ method: "getFrameIdOfSearchedFrame" },
function(response) {
log("Checking which frame is searched. Done.", LOG_SEV_DEBUG);
frame.contentWindow.postMessage("ResetSearchedFrame", "*");
if (!response) {
callback(-1);
return;
}
callback(response.frameId);
});
}
}
self.GetFrameId = function (frame, callback) {
if (typeof (frame) === typeof (undefined)) {
return -1;
}
log("Reseting all searched frames.", LOG_SEV_DEBUG);
resetAllSearchedFrames(window.top, function() {
setAndCheckSearchedFrame(frame, callback);
});
return AsyncMethod;
}
self.GetFrameElementById = function (frameId, callback) {
GetFrameElementByIdInternal(frameId, 0, callback);
return AsyncMethod;
}
function GetFrameElementByIdInternal(frameId, index, callback) {
var allFrames = getAllFramesRecursive();
if (index >= allFrames.length) {
callback(null);
return;
}
var frame = allFrames[index];
if (typeof(frame) === typeof(undefined)) {
GetFrameElementByIdInternal(frameId, index + 1, callback);
return;
}
self.GetFrameId(frame, function (frameIdOfElement) {
if (frameIdOfElement === frameId) {
callback(frame);
} else {
GetFrameElementByIdInternal(frameId, index + 1, callback);
}
});
}
if (window.addEventListener) {
window.addEventListener("message", receiveParentFrameMessage, false);
} else {
window.attachEvent("onmessage", receiveParentFrameMessage);
}
function receiveParentFrameMessage(event) {
if (event.data && event.data === "SetSearchedFrame") {
window.ToscaIsCurrentlySearchedFrame = true;
log("window.ToscaIsCurrentlySearchedFrame set to " + window.ToscaIsCurrentlySearchedFrame, LOG_SEV_DEBUG);
} else if (event.data && event.data === "ResetSearchedFrame") {
window.ToscaIsCurrentlySearchedFrame = false;
log("window.ToscaIsCurrentlySearchedFrame set to " + window.ToscaIsCurrentlySearchedFrame, LOG_SEV_DEBUG);
}
}
function addAllTagElementsToArray(tag, array) {
addAllTagElementsForDocumentToArray(document, tag, array);
}
function addAllTagElementsForDocumentToArray(doc, tag, array) {
var frames = doc.getElementsByTagName(tag);
for (var i = 0; i < frames.length; i++) {
array.push(frames[i]);
}
}
function addFramesFromShadowDOM(elements, allFrames) {
for (var i = 0; i < elements.length; i++) {
var element = elements[i];
if (typeof (element.shadowRoot) !== typeof (undefined) && element.shadowRoot !== null) {
var shadowFrames = element.shadowRoot.querySelectorAll("frame");
for (var j = 0; j < shadowFrames.length; j++) {
allFrames.push(shadowFrames[j]);
}
var shadowiFrames = element.shadowRoot.querySelectorAll("iframe");
for (var j = 0; j < shadowiFrames.length; j++) {
allFrames.push(shadowiFrames[j]);
}
var shadowElements = element.shadowRoot.querySelectorAll("*");
addFramesFromShadowDOM(shadowElements, allFrames);
}
}
}
function getAllFrames() {
var allFrames = new Array();
// Workaround for IE7. Array.push not available when getElementsByTagName returns empty value.
addAllTagElementsToArray("iframe", allFrames);
addAllTagElementsToArray("frame", allFrames);
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_Chrome) {
var allElements = document.getElementsByTagName("*");
addFramesFromShadowDOM(allElements, allFrames);
}
return allFrames;
}
function getAllFramesForDocument(doc) {
var allFrames = new Array();
// Workaround for IE7. Array.push not available when getElementsByTagName returns empty value.
addAllTagElementsForDocumentToArray(doc, "iframe", allFrames);
addAllTagElementsForDocumentToArray(doc, "frame", allFrames);
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_Chrome) {
var allElements = doc.getElementsByTagName("*");
addFramesFromShadowDOM(allElements, allFrames);
}
for (var i = 0; i < allFrames.length; i++) {
try {
var childFrame = allFrames[i];
var childDocument = childFrame.contentDocument;
var childDocumentFrames = getAllFramesForDocument(childDocument);
for (var j = 0; j < childDocumentFrames.length; j++) {
allFrames.push(childDocumentFrames[j]);
}
} catch (e) {
//ignore c
}
}
return allFrames;
}
function getAllFramesRecursive() {
return getAllFramesForDocument(document);
}
function isEmbeddedIEInEdge(element) {
if (CURRENT_BROWSER === TOSCA_BROWSER_ID_IE) {
var elementType = reflection.GetHtmlType(element).toUpperCase();
if (elementType === "FORM" || elementType === "SELECT") {
if (!element.IsVisible) {
return true;
} else {
return false;
}
}
}
}
function isJavaApplet(element) {
if (element.tagName == undefined) {
return false;
}
var tagName = element.tagName.toUpperCase();
return tagName === "APPLET";
}
}
function GetElementBorderWidthsInternal(cStyle) {
var rect = new function ClientRect() {
this.left = 0;
this.right = 0;
this.top = 0;
this.bottom = 0;
};
function getNum(prop) {
var num = 0;
if (prop.length)
num = parseInt(prop);
if (isNaN(num))
num = 0;
return num;
}
if (cStyle) {
rect.left = getNum(cStyle.borderLeftWidth) + getNum(cStyle.paddingLeft);
rect.top = getNum(cStyle.borderTopWidth) + getNum(cStyle.paddingTop);
rect.right = getNum(cStyle.borderRightWidth) + getNum(cStyle.paddingRight);
rect.bottom = getNum(cStyle.borderBottomWidth) + getNum(cStyle.paddingBottom);
}
return rect;
};
function IsSapUI5Page(window) {
return window.document.documentElement.getAttribute('data-sap-ui-browser') != null || /\bsap-desktop\b/.exec(window.document.documentElement.className) != null;
}
function CommonJavaScriptServer(javaScriptServer, browserType, WsSocket) {
var self = javaScriptServer;
InternalProxyObjectImplementation(self);
self.init = function () {
self.Reset();
};
self.Ping = function () {
browserType.tabs.query({ 'active': true }, function (tab) {
browserType.tabs.sendMessage(tab[0].id, { Data: "PING" }, function (response) {
if (response.Data != "PONG") {
state = "Automation NOT possible! Connection to content script lost!";
}
else {
state = "Automation possible!";
}
});
});
};
browserType.runtime.onMessage.addListener(function (request, sender, sendResponse) {
if (request.method === "getLogLevel") {
sendResponse({ logLevel: localStorage['logLevel'] });
} else if (request.method === "waitForAllFramesToReset") {
browserType.webNavigation.getAllFrames({ tabId: sender.tab.id },
function (details) {
waitTillAllSearchedFramesAreReset(details, sender, sendResponse, 0);
});
return true;
} else if (request.method === "getFrameIdOfSearchedFrame") {
browserType.webNavigation.getAllFrames({ tabId: sender.tab.id },
function (details) {
findSearchedFrame(details, sender, sendResponse, 0);
});
return true;
} else if (request.message === "getSfSession") {
browserType.cookies.get({ url: "https://" + request.sfHost, name: "sid", storeId: sender.tab.cookieStoreId },
function (sessionCookie) {
if (!sessionCookie) {
sendResponse(null);
return;
}
sendResponse(sessionCookie.value);
});
return true;
} else if (request.message === "getSfDomain") {
browserType.tabs.query({ active: true }, function(tabs) {
browserType.cookies.get({ url: tabs[0].url, name: "sid", storeId: sender.tab.cookieStoreId }, function(cookie){
if (!cookie) {
sendResponse(null);
return;
}
var orgId = cookie.value.split("!")[0];
browserType.cookies.getAll({ name: "sid", domain: "salesforce.com", secure: true, storeId: sender.tab.cookieStoreId }, function(cookies){
var sessionCookie = cookies.filter(function(c) { return c.value.startsWith(orgId + "!") })[0];
if (sessionCookie) {
sendResponse(sessionCookie.domain);
} else {
sendResponse(null);
return;
}
});
});
});
return true;
}
});
function waitTillAllSearchedFramesAreReset(details, sender, sendResponse, retry) {
var responsesReceived = 0;
var allFalse = true;
log("Waiting for " + details.length + " frames to reset.", LOG_SEV_DEBUG)
for (var i = 0; i < details.length; i++) {
var detail = details[i];
browserType.tabs.sendMessage(sender.tab.id,
{ Data: "IsSearchedFrame", frameId: detail.frameId },
{ frameId: detail.frameId },
function(response) {
responsesReceived++;
if (response && response.IsSearchedFrame === true) {
allFalse = false;
}
if (responsesReceived === details.length) {
if (allFalse === true) {
sendResponse({});
} else {
if (retry < 20) {
waitTillAllSearchedFramesAreReset(details, sender, sendResponse, retry + 1);
} else {
sendResponse({});
}
}
}
});
}    }
function findSearchedFrame(details, sender, sendResponse, retry) {
var responsesReceived = 0;
var foundFrameIds = [];
for (var i = 0; i < details.length; i++) {
var detail = details[i];
browserType.tabs.sendMessage(sender.tab.id,
{ Data: "IsSearchedFrame", frameId: detail.frameId },
{ frameId: detail.frameId },
function (response) {
responsesReceived++;
if (response && response.IsSearchedFrame === true) {
foundFrameIds.push(response.frameId);
}
if (responsesReceived === details.length) {
if (foundFrameIds.length === 1) {
sendResponse({ frameId: foundFrameIds[0] });
} else {
if (retry < 20) {
findSearchedFrame(details, sender, sendResponse, retry + 1);
} else {
sendResponse({ frameId: -1});
}
}
}
});
}
}
//=================================Dispatching requests==================================
self.ProcessRequest = function(request, tabId, frameIndex) {
try {
SendRequestToSpecificTab(request, tabId, frameIndex);
} catch (e) {
var LB = "\r\n";
var errBuffer = e.toString() + LB;
errBuffer += "StackTrace: " + e.stack + LB;
log(errBuffer, LOG_SEV_ERROR);
}
};
self.ResetAllTabs = function(request) {
browserType.tabs.query({}, function (tab) {
for (var i = 0; i < tab.length; i++) {
SendRequestToTab(tab[i], request);
}
});
}
self.PingTabBeforeCall = function(id, maxRetries, includeTimeout, callback) {
var hasReturned = false;
browserType.tabs.sendMessage(id, { Data: "PING" }, function (response) {
if (!hasReturned) {
hasReturned = true;
if ((browserType.runtime.lastError === undefined || browserType.runtime.lastError === null) && response && response.Data === "PONG") {
callback();
return;
}
if (maxRetries < 0) {
self.SendFailedTransactionResponse("Cannot interact with the tab. Please check if the page is loaded.");
}
self.PingTabBeforeCall(id, maxRetries - 1, includeTimeout, callback);
}
});
if (includeTimeout) {
setTimeout(function() {
if (!hasReturned) {
hasReturned = true;
self.SendFailedTransactionResponse("Cannot interact with the tab. Please check if the page is loaded.");
}
},
2000);
}
}
function HandleResponse(response) {
if (response && response.Data) {
WsSocket.send(response.Data);
return;
}
state = "Automation NOT possible! Connection to content script lost!";
self.SendFailedTransactionResponse("Cannot interact with the tab. Please check if the page is loaded.");
}
function SendRequestToTab(tab, frameIndex, request) {
var tabResponded = false;
if (typeof (frameIndex) !== typeof (undefined)) {
browserType.tabs.sendMessage(tab.id,
{ Data: request },
{ frameId: frameIndex },
function (response) {
tabResponded = true;
HandleResponse(response);
});
} else {
browserType.tabs.sendMessage(tab.id,
{ Data: request },
function(response) {
tabResponded = true;
HandleResponse(response);
});
}
setTimeout(function () {
if (!tabResponded) {
self.PingTabBeforeCall(tab.id, 1, false, function () {
if (!tabResponded) {
log("Got no respnse from tab after 30 s. Request: " + request, LOG_SEV_ERROR);
self.SendFailedTransactionResponse("Cannot interact with the tab. Please check if the page is loaded.");
}
});
}
}, 30000);
}
function SendRequestToSpecificTab(request, tabId, frameIndex) {
browserType.tabs.get(tabId, function (tab) {
if (browserType.runtime.lastError !== undefined && browserType.runtime.lastError !== null) {
self.SendFailedTransactionResponse("Cannot interact with the tab. The following error occurred: " + browserType.runtime.lastError.message);
return;
}
if (tab.status !== "complete") {
self.SendFailedTransactionResponse("Cannot interact with busy tab.");
return;
}
SendRequestToTab(tab, frameIndex, request);
});
}
self.SendFailedTransactionResponse = function(message) {
var failedResponse = new TransactionFailedResponse();
failedResponse.Message = message;
WsSocket.send(JSON.stringify(failedResponse));
}
//=================================End of Dispatching requests==================================
}
function InternalProxyObjectImplementation(javaScriptServer) {
var self = javaScriptServer;
self.InternalProxyObject = new InternalProxy();
self.AddObject = function (obj) {
return (self.InternalProxyObject.AddObject(obj));
};
self.GetObject = function (referenceId) {
return self.InternalProxyObject.GetObject(referenceId);
};
self.DeleteObject = function (referenceId) {
return self.InternalProxyObject.DeleteObject(referenceId);
};
}
function CommonWebSocket(IPAddr, portNumber, serverName) {
function GetUrl() {
var portSettingName = "port";
if (!localStorage[portSettingName]) {
localStorage[portSettingName] = portNumber;
}
return IPAddr + localStorage[portSettingName] + serverName;
};
var WsSocket = new WebSocket(GetUrl());
WsSocket.onopen = function () {
state = "Automation possible!";
};
WsSocket.onclose = function () {
state = "Automation NOT possible! Connection to server lost, trying to reconnect...";
setTimeout(function () { startServer() }, 5000);
};
WsSocket.onerror = function (errorEvent) {
logEvent("Error while connecting to Service", LOG_SEV_ERROR, errorEvent);
};
return WsSocket;
}
function CommonContentJavaScriptServer() {
var self = this;
self.requestHandler = new RequestHandler(self);
self.asynchronousResponse = {};
self.EntryPoint = null;
InternalProxyObjectImplementation(self);
self.Reset = function () {
self.EntryPoint = new CommonEntryPoint();
self.InternalProxyObject.Reset();
self.InternalProxyObject.AddObject(self.EntryPoint);
};
self.HandleRequest = function (data) {
self.asynchronousResponse = "";
try {
var transaction = JSON.parse(data);
this.requestHandler.HandleRequest(transaction, function (response) {
var arrayTojson = undefined;
if (Array.prototype.toJSON != undefined) {
arrayTojson = Array.prototype.toJSON;
delete Array.prototype.toJSON;
}
self.asynchronousResponse = JSON.stringify(response);
if (arrayTojson != undefined) {
Array.prototype.toJSON = arrayTojson;
}
});
} catch (e) {
var LB = "\r\n";
var errBuffer = e.toString() + LB;
errBuffer += "StackTrace: " + e.stack + LB;
log("[RequestHandler.HandleRequest] Error: " + errBuffer, LOG_SEV_ERROR);
var failedResponse = new TransactionFailedResponse();
failedResponse.Message = errBuffer;
self.asynchronousResponse = JSON.stringify(failedResponse);
}
return self.asynchronousResponse;
};
}
document.TOSCA_Ping = function (data) {
return "pong";
}
document.TOSCA_HandleRequest = function (data) {
return javaScriptServer.HandleRequest(data);
};
document.TOSCA_GetAsynchronousResponse = function() {
return javaScriptServer.asynchronousResponse;
};
document.TOSCA_GetCachedObject = function (id) {
return javaScriptServer.GetObject(id);
};
var javaScriptServer = new CommonContentJavaScriptServer();
javaScriptServer.Reset();
function MessageHandler() {
function requestListner(request, sender, sendResponse) {
try {
var data = request.Data;
if (data === "PING") {
sendResponse({ Data: "PONG" });
return false;
}
if (data === "IsSearchedFrame") {
var isSearchedFrame = window.ToscaIsCurrentlySearchedFrame === true;
var isSearchedFrameResponse = { IsSearchedFrame: isSearchedFrame, frameId: request.frameId };
log("IsSearchedFrame response: IsSearchedFrame=" + isSearchedFrameResponse.IsSearchedFrame + "; frameId=" + isSearchedFrameResponse.frameId, LOG_SEV_DEBUG);
sendResponse(isSearchedFrameResponse);
return false;
}
var response = javaScriptServer.HandleRequest(data);
if (response !== "") {
sendResponse({ Data: response });
return false;
} else {
var startTime = new Date();
checkAsychronousResponse(sendResponse, startTime);
}
// Return true to signal chrome that sendResponse will be called asynchronously.
// Otherwise it will dispose the connection.
return true;
} catch (e) {
var LB = "\r\n";
var errBuffer = e.toString() + LB;
errBuffer += "StackTrace: " + e.stack + LB;
log(errBuffer, LOG_SEV_ERROR);
var errorMessage = new TransactionFailedResponse();
errorMessage.Message = errBuffer;
sendResponse({ Data: errorMessage });
}
};
function checkAsychronousResponse(sendResponse , startTime) {
var response = javaScriptServer.asynchronousResponse;
if (response !== "") {
sendResponse({ Data: response  });
return;
}
var curTime = new Date();
var elapsedTime = curTime - startTime;
if (elapsedTime < 30000) {
setTimeout(function () { checkAsychronousResponse(sendResponse, startTime); }, 100);
} else {
var errorMessage = "Asynchronous Call exceeded the maximum timeout.";
log(errorMessage, LOG_SEV_ERROR);
var failedTransaction = new TransactionFailedResponse();
failedTransaction.Message = errorMessage;
sendResponse({ Data: failedTransaction });
}
}
chrome.runtime.onMessage.addListener(requestListner);
function onAlertOpened() {
chrome.runtime.sendMessage({ method: "AlertOpened"});
}
function onAlertClosed() {
chrome.runtime.sendMessage({ method: "AlertClosed" });
}
document.addEventListener("ToscaAlertOpened", onAlertOpened);
document.addEventListener("ToscaAlertClosed", onAlertClosed);
}
var myMessageHandler = new MessageHandler();
