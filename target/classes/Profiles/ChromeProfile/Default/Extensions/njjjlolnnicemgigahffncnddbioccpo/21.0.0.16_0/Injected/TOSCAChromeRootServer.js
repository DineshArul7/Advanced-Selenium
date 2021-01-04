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
function logEvent(msg, severity, event) {
SetActiveLogLevel();
if (severity <= ACTIVELOGLEVEL) {
if (window.console) {
if (window.console.log) {
window.console.log("[" + severity + "]: " + msg + ": ");
if (event != null) {
window.console.log(event);
}
}
}
}
}
function log(msg, severity) {
logEvent(msg, severity, null);
}
function SetActiveLogLevel() {
if (ACTIVELOGLEVEL == undefined) {
ACTIVELOGLEVEL = localStorage["logLevel"];
if (ACTIVELOGLEVEL == undefined) {
localStorage["logLevel"] = 0;
ACTIVELOGLEVEL = 0;
}
}
}
//severity levels used for log(msg, severity)
LOG_SEV_DEBUG = 3;
LOG_SEV_INFO = 2;
LOG_SEV_WARN = 1;
LOG_SEV_ERROR = 0;
var ACTIVELOGLEVEL;
function ChromeRootEntryPoint() {
var self = this;
self.GetTechnicalTypeOfInstance = function (obj) {
return new TechnicalTypeInfo(obj);
};
self.MapExtensionMethods = function (element) {
};
self.DocumentTabs = new Array();
self.GetAllTabs = function (steerableOnly, callback) {
chrome.tabs.query({}, function (tabs) {
GetTabs(tabs, function (documentTabs) {
GetSteerableTabs(documentTabs, callback);
});
});
return AsyncMethod;
};
self.GetAllTabsUnfiltered = function (callback) {
chrome.tabs.query({}, function (tabs) {
GetTabs(tabs, callback);
});
return AsyncMethod;
};
self.GetAllActiveTabs = function (steerableOnly, callback) {
chrome.tabs.query({ "active": true }, function (tabs) {
GetTabs(tabs, function (documentTabs) {
GetSteerableTabs(documentTabs, function (filteredtabs) {
chrome.windows.getAll(function(windows) {
if (windows.length !== filteredtabs.length) {
RefreshUnsteerableTabs(tabs, windows, filteredtabs, callback);
} else {
callback(filteredtabs);
}
});
});
});
});
return AsyncMethod;
};
function RefreshUnsteerableTabs(tabs, windows, filteredtabs, callback) {
var callBackWillHappen = false;
for (var i = 0; i < windows.length; i++) {
var foundActiveSteerableTabForWindow = HasActiveSteerableTab(tabs, filteredtabs, windows[i]);
if (foundActiveSteerableTabForWindow === false) {
callBackWillHappen = true;
RefreshTabAndGetAllTabsAgain(tabs, windows[i], callback);
}
}
if (callBackWillHappen === false) {
callback(filteredtabs);
}
}
var refreshedTabIds = [];
function RefreshTabAndGetAllTabsAgain(tabs, window, callback) {
for (var k = 0; k < tabs.length; k++) {
if (tabs[k].windowId === window.id) {
var OnTabsRefreshed = function (tabId, info) {
if (info.status == "complete" && refreshedTabIds.indexOf(tabId) !== -1) {
var index = refreshedTabIds.indexOf(tabId);
refreshedTabIds.splice(index, 1);
if (refreshedTabIds.length === 0) {
chrome.tabs.onUpdated.removeListener(OnTabsRefreshed);
}
chrome.tabs.query({ "active": true }, function(refreshedTabs) {
GetTabs(refreshedTabs, function (refreshedDocumentTabs) {
GetSteerableTabs(refreshedDocumentTabs, callback);
});
});
}
};
if (refreshedTabIds.length === 0) {
chrome.tabs.onUpdated.addListener(OnTabsRefreshed);
}
chrome.tabs.reload(tabs[k].id);
refreshedTabIds.push(tabs[k].id);
}
}
}
function HasActiveSteerableTab(tabs, filteredtabs, window) {
for (var j = 0; j < filteredtabs.length; j++) {
for (var l = 0; l < tabs.length; l++) {
if (tabs[l].id === filteredtabs[j].id) {
if (tabs[l].windowId === window.id) {
return true;
}
}
}
}
var activeTab = tabs.find(tab => tab.windowId === window.id && tab.active === true);
if (activeTab !== undefined && activeTab !== null) {
var activeDocTab = self.DocumentTabs.find(docTab => docTab.id === activeTab.id);
if (activeDocTab !== undefined && activeDocTab !== null && activeDocTab.alertOpen === true) {
return true;
}
}
return false;
}
function GetSteerableTabs(documentTabs, callback) {
var filteredDocuments = [];
var count = 0;
if (documentTabs.length === 0) {
callback([]);
}
documentTabs.forEach(function (documentTab) {
function checkForEnd() {
if (count === documentTabs.length - 1) {
callback(filteredDocuments);
return;
}
count++;
}
documentTab.IsBusy(false, function (isbusy) {
if (isbusy) {
// cannot validate tab if it is busy.
filteredDocuments.push(documentTab);
checkForEnd();
return;
}
documentTab.IsValid(function (valid) {
if (valid) {
filteredDocuments.push(documentTab);
}
checkForEnd();
});
});
});
}
function GetTabs(tabs, callback) {
var documentTabs = [];
for (var i = 0; i < tabs.length; i++) {
var documentTab = GetCachedChromeDocumentTab(tabs[i]);
documentTabs.push(documentTab);
}
callback(documentTabs);
}
self.Uninstall = function () {
chrome.management.uninstallSelf();
};
self.GetActiveTab = function (callback) {
chrome.tabs.query({"active": true }, function (tabs) {
var activeTab = undefined;
if (tabs.length == 1) {
activeTab = GetCachedChromeDocumentTab(tabs[0]);
}
callback(activeTab);
});
return AsyncMethod;
};
function GetCachedChromeDocumentTab(tab) {
for (var i = 0; i < self.DocumentTabs.length; i++) {
if (self.DocumentTabs[i].id === tab.id) {
return self.DocumentTabs[i];
}
}
var newChromeTab = new ChromeDocumentTab(tab);
self.DocumentTabs.push(newChromeTab);
return newChromeTab;
}
self.GetChromeDocumentTab = function (serverId) {
for (var i = 0; i < self.DocumentTabs.length; i++) {
if (self.DocumentTabs[i].ServerId === serverId) {
return self.DocumentTabs[i];
}
}
return undefined;
};
self.GetDocumentFrame = function (serverId, frameIndex) {
var chromeDocumentTab = self.GetChromeDocumentTab(serverId);
if (!chromeDocumentTab) {
log("Parent document with serverid'" + serverId + "' for frame with index '" + frameIndex + "' not found",
LOG_SEV_ERROR);
return null;
}
for (var i = 0; i < self.DocumentTabs.length; i++) {
var cachedDocument = self.DocumentTabs[i];
if (cachedDocument.ContainerDocumentInformation &&
cachedDocument.FrameIndex &&
cachedDocument.ContainerDocumentInformation === chromeDocumentTab &&
cachedDocument.FrameIndex === frameIndex) {
return cachedDocument;
}
}
var newFrame = new ChromeDocumentFrame(frameIndex, chromeDocumentTab);
self.DocumentTabs.push(newFrame);
return newFrame;
}
}
ChromeDocumentTab.nextServerId = 0;
function ChromeDocumentTab(tab, self) {
if (!self) {
self = this;
}
var windowId = tab.windowId;
self.tab = tab;
self.id = tab.id;
self.alertOpen = false;
self.ServerId = ChromeDocumentTab.nextServerId;
ChromeDocumentTab.nextServerId += 1;
self.Title = function (callback) {
chrome.tabs.get(self.id, function (requestedTab) {
if (chrome.runtime.lastError !== undefined) {
callback(new Error(chrome.runtime.lastError.message));
return;
}
callback(requestedTab.title);
});
return AsyncMethod;
};
self.BrowserTitle = function (callback) {
chrome.tabs.get(self.id, function (requestedTab) {
if (chrome.runtime.lastError !== undefined) {
callback(new Error(chrome.runtime.lastError.message));
return;
}
chrome.tabs.query({ "windowId": requestedTab.windowId, "active": true }, function (currentActiveTabsInWindow) {
var activeTab = currentActiveTabsInWindow[0];
if (activeTab == undefined) {
callback(new Error("Could not retrive active Tab of Window"));
return;
}
callback(activeTab.title);
});
});
return AsyncMethod;
};
self.IsBusy = function (synchStateInteractive, callback) {
chrome.tabs.get(self.id, function (requestedTab) {
if (chrome.runtime.lastError !== undefined) {
callback(new Error(chrome.runtime.lastError.message));
return;
}
var documentIsBusy;
if (synchStateInteractive) {
documentIsBusy = (requestedTab.status !== "complete");
} else {
documentIsBusy = requestedTab.status !== "complete" && requestedTab.status !== "interactive";
}
callback(documentIsBusy);
});
return AsyncMethod;
};
self.IsVisible = function (callback) {
chrome.tabs.get(self.id, function (requestedTab) {
if (chrome.runtime.lastError !== undefined) {
callback(new Error(chrome.runtime.lastError.message));
return;
}
callback(requestedTab.active);
});
return AsyncMethod;
};
self.IsValid = function (callback) {
pingTab(5, callback);
return AsyncMethod;
};
self.Activate = function (callback) {
chrome.tabs.update(self.id, { "active": true }, function (updatedTab) {
if (chrome.runtime.lastError !== undefined) {
callback(new Error(chrome.runtime.lastError.message));
return;
}
if (updatedTab.active === true) {
callback(true);
} else {
callback(false);
}
});
return AsyncMethod;
};
self.GetScreenShot = function (callback) {
chrome.tabs.query({ "active": true, "windowId": windowId }, function (tabs) {
if (chrome.runtime.lastError !== undefined) {
callback(new Error(chrome.runtime.lastError.message));
return;
}
ScreenShotTab(10, function(data) {
chrome.tabs.update(tabs[0].id, { "active": true }, function () {
if (chrome.runtime.lastError !== undefined) {
callback(new Error(chrome.runtime.lastError.message));
return;
}
callback(data);
});
});
});
return AsyncMethod;
};
self.Close = function() {
chrome.tabs.remove(self.id);
};
function ScreenShotTab(maxRetries, callback) {
self.Activate(function () {
chrome.tabs.captureVisibleTab(windowId, {}, function (data) {
var lastError = chrome.runtime.lastError;
if (lastError === undefined || lastError === null || maxRetries <= 0) {
callback(data);
return;
}
log("Error in capturing Screenshot of Webpage: " + lastError.message, LOG_SEV_WARN);
window.setTimeout(function () {
ScreenShotTab(maxRetries - 1, callback);
}, 50);
});
});
}
function pingTab(maxRetries, callback) {
self.IsBusy(false, function (isbusy) {
if (isbusy) {
callback(false);
return;
}
if (self.alertOpen === true) {
callback(false);
return;
}
chrome.tabs.sendMessage(self.id, { Data: "PING" }, { frameId: 0 }, function (response) {
if (chrome.runtime.lastError === undefined && response && response.Data === "PONG") {
callback(true);
return;
}
if (maxRetries < 0) {
callback(false);
return;
}
pingTab(maxRetries - 1, callback);
});
});
};
}
function ChromeDocumentFrame(frameId, containerDocumentInformation) {
var self = this;
ChromeDocumentTab(containerDocumentInformation.tab, self);
self.FrameIndex = frameId;
self.ContainerDocumentInformation = containerDocumentInformation;
}
