/*
    ***** BEGIN LICENSE BLOCK *****
    
    Copyright © 2009 Center for History and New Media
                     George Mason University, Fairfax, Virginia, USA
                     http://zotero.org
    
    This file is part of Zotero.
    
    Zotero is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    Zotero is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with Zotero.  If not, see <http://www.gnu.org/licenses/>.
    
    ***** END LICENSE BLOCK *****
*/

/**
 * @fileOverview Tools for automatically extracting facts from pdf
 */

/**
 * Front end for extracting facts from PDFs
 * @namespace
 */
var Zotero_huangxc = new function() {
	Components.utils.import("resource://zotero/q.js");
	this.getJar = getJar;
	this.getRuleMatcher = getRuleMatcher;
	
	function getJar() {
		var jarFile = Zotero.getZoteroDirectory();
		jarFile.append("testBatch6.jar");
		return jarFile;
	};
	function getRuleMatcher() {
		var ruleMatcherFile = Zotero.getZoteroDirectory();
		ruleMatcherFile.append("Rule_INPUT");
		ruleMatcherFile.append("RuleMatcher.json");
		return ruleMatcherFile;
	};
	
	function getRuleMatcherFolder() {
		var ruleMatcherFolder = Zotero.getZoteroDirectory();
		ruleMatcherFolder.append("Rule_INPUT");
		return ruleMatcherFolder;
	};
	
	function getRuleMatcherFileNames() {
		var matchers = [
		"RuleMatcher.json", 
		"Rule_POSTag_Comparatives.txt", 
		"Rule_POSTag_Nouns.txt", 
		"Rule_RegExp.txt",
		"comparative_1.txt",
		"comparative_keywords_from_Liu.txt",
		"invalid_words_for_ngram.txt",
		"negation_bioscope.txt",
		"negative-words.txt",
		"operator_1.txt",
		"rel_1.txt",
		"signal_1.txt",
		"uncertainty-words.txt",
		"uncertainty_bioscope.txt"
		];
		return matchers;
		
	}
	
	this.checkAndDownload = checkAndDownload;
	function checkAndDownload () { 
		return new Promise(function(resolve, reject) {
			var jarFile1 = getJar();
			Zotero.debug(jarFile1.path + " exists? " + jarFile1.exists());
			var ruleMatcherFile = getRuleMatcher();
			Zotero.debug(ruleMatcherFile.path + " exists? " + ruleMatcherFile.exists());
			var jarSuccess = false;
			var matcherSuccess = false;
			if(!jarFile1.exists()) {
				var url1 = "http://52.5.78.150/public/fact_extractor/testBatch6.jar";
				var sent1 = Zotero.HTTP.doGet(url1, function (xmlhttp) {
					try {
						if (xmlhttp.status != 200) {
							//throw new Error("Unexpected response code " + xmlhttp.status);
							reject("Unexpected response code " + xmlhttp.status);
						}
						var data = xmlhttp.responseText;
						Zotero.debug("receive data: length= " + data.length);
						Zotero.File.putContents(jarFile1, data);
						jarSuccess = true;
						if(jarSuccess && matcherSuccess) {
							resolve("Success");
						}
						}
					catch (e) {
						reject("Failed to download: " + xmlhttp.responseURL + "\r\n" + e);
					}
				});
			}
			if(!ruleMatcherFile.exists()){
				var success = 0;
				var matchers = getRuleMatcherFileNames();
				for(var matcher in matchers) {
					var url2 = "http://52.5.78.150/public/fact_extractor/Rule_INPUT/" + matchers[matcher];
					var sent2 = Zotero.HTTP.doGet(url2, function (xmlhttp) {
						try {
							if (xmlhttp.status != 200) {
								throw new Error("Unexpected response code " + xmlhttp.status);
							}
							var data = xmlhttp.responseText;
							Zotero.debug("receive data: length=" + data.length);
							var ruleMatcherFolder = getRuleMatcherFolder();
							Zotero.File.createDirectoryIfMissing(ruleMatcherFolder);
							var matcherFile = ruleMatcherFolder;
							var fileName = xmlhttp.responseURL.substring(xmlhttp.responseURL.lastIndexOf("/") + 1, xmlhttp.responseURL.length);
							matcherFile.append(fileName);
							Zotero.debug("write data to " + fileName);
							Zotero.File.putContents(matcherFile, data);
							Zotero.debug(matcherFile.path + " exists? " + matcherFile.exists() + " at " + Date.now());
							success = success + 1;
							Zotero.debug("sucess=" + success + "matchers.size=" + matchers.length);
							if(success == matchers.length) {
								matcherSuccess = true;
								if(jarSuccess && matcherSuccess) {
									resolve("Success");
								}
							}
							}
						catch (e) {
							reject("Failed to download: " + xmlhttp.responseURL + "\r\n" + e);
						}
					});
				}
			}
		});
		//download.then(
		//function resolve(response) {return true}, 
		//function reject(response){Zotero.debug("reject: " + response);} return false);
	};
	
	this.canExtract = function(/**Zotero.Item*/ item) {
		return (item.attachmentMIMEType &&
			item.attachmentMIMEType == "application/pdf" && !item.getSource());
	};
	this.extractAndsend = function(file) {
		Zotero.debug("Entering Zotero.huangxc.extractAndsend");
		
		this.checkAndDownload().then(function resolve(response) {
		//check if facts have been extracted
		Zotero.Utilities.Internal.md5Async(file).then(function (fileHash) {
			Zotero.debug("hash of " + file.path + " is " + fileHash);
			var te = Zotero.getZoteroFactsDirectory();//facts file 
			te.append(fileHash + "_facts.json");
			if(te.exists()) {
				Zotero.debug("facts for " + file.path + " is " + te.path + ", which exists!");
				return;
			}
			
			getJARExecAndArgs = function () {
			var execl = Zotero.getZoteroDirectory();
			execl.append("testBatch6.jar");
			return {
				exec: execl,
				args: []
			}
			}
			var {exec, args} = getJARExecAndArgs();
			args.push(file.path);
			var outputPath = Zotero.getZoteroFactsDirectory().path + "\\";
			var debugPath = Zotero.getZoteroDirectory().path + "\\debug\\";
			var ruleMatcherPath = Zotero.getZoteroDirectory().path + "\\Rule_INPUT\\RuleMatcher.json";
			var debugLogPath = Zotero.getZoteroDirectory().path + "\\debug.txt";
			args.push(outputPath);
			args.push(debugPath);
			args.push(ruleMatcherPath);
			args.push(debugLogPath);
			args.push(te.path);
			Zotero.debug("Extracting Facts: Running " + exec.path + " " + args.map(arg => "'" + arg + "'").join(" ") + "; at "+ Date.now());
			Zotero.Utilities.Internal.exec(exec, args).then(function() {
				Zotero.debug("end of extracting; at " + Date.now());
				Zotero.debug("syn: file path is " + te.path + "; exists? " + te.exists() + "; at " + Date.now());
				var userName = "Huangxc";
				var filePath = fileHash;
				var data = Zotero.File.getContents(te);
				Zotero.debug("successfully reading the file: lenth= " + data.length);
				var oReq = new XMLHttpRequest();
				function reqListener () {
					Zotero.debug("Response from server:" + this.responseText);
				}
				oReq.onreadystatechange = function (oEvent) {
				if (oReq.readyState == 4) {
					if(oReq.status == 200)
						Zotero.debug("Done uploading %o, response is %s", oEvent, oReq.responseText);
					else
						Zotero.debug("Error loading page " + oReq.status);
				}
				Zotero.debug("ready state change: readyState=" + oReq.readyState + " msg=" + oReq.responseText + " status=" + oReq.status);
				};
				oReq.addEventListener("load", reqListener);
				oReq.onload = function (oEvent) {
						Zotero.debug("Done loading %o, response is %s", oEvent, oReq.responseText);
				};
				var content= data;
				var url = "http://52.5.78.150:8080/upload?uri=" + filePath + "_facts.json" + "&id=" + userName;
				Zotero.debug("sending httprequest:" + url);
				var dataBlob = new Blob([content], { type: "text/html" });
				var formData = new FormData();
				formData.append("data",dataBlob);
				oReq.open("POST", url);
				oReq.send(formData);
			}, function() {
				Zotero.debug("error happened when extracting facts; at " + Date.now());
			});
		})
		},function reject(response) {Zotero.debug("downloading failed: " + response);});
	};
	
	this.huangxcSelected = function() {
		Zotero.debug("Entering fact extraction");
		var items = ZoteroPane_Local.getSelectedItems();
		if (!items) return;
		this._items = [];
		this._items = items.slice();
		while(true) {
			if(!this._items.length) return;
			var item = this._items.shift();
			var file = item.getFile();
			Zotero.debug("Target file: " + file.path);
			this.extractAndsend(file);
		}
	};	
};
Zotero.huangxc = Zotero_huangxc;