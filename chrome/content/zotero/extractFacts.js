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
var Zotero_extractFacts = new function() {
	Components.utils.import("resource://zotero/q.js");
	this.getJar = getJar;
	this.getRuleMatcher = getRuleMatcher;
	
	function getJar() {
		var jarFile = Zotero.getZoteroDirectory();
		jarFile.append("factExtractor.jar");
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
	
	function estimateSpaceRequirement (whichFiles) {
		return new Promise(function (resolve, reject) {
			var url = "http://factpub.org:8080/getSize?whichFiles=" + whichFiles;
			var oReq = new XMLHttpRequest();
			function reqListener () {
					Zotero.debug("In estimateSpaceRequirement, Response from server:" + this.responseText);
				}
				oReq.onreadystatechange = function (oEvent) {
				if (oReq.readyState == 4) {
					if(oReq.status == 200) {
						Zotero.debug("In estimateSpaceRequirement,Done uploading %o, response is %s", oEvent, oReq.responseText);
						resolve(oReq.responseText);
						return;
					}
					else{
						Zotero.debug("In estimateSpaceRequirement,Error loading page " + oReq.status);
						reject("Failed to reterive file size");
						return;
					}
				}
				Zotero.debug("In estimateSpaceRequirement,ready state change: readyState=" + oReq.readyState + " msg=" + oReq.responseText + " status=" + oReq.status);
				};
				oReq.addEventListener("load", reqListener);
				oReq.onload = function (oEvent) {
						Zotero.debug("In estimateSpaceRequirement, Done loading %o, response is %s", oEvent, oReq.responseText);
				};
				Zotero.debug("sending httprequest:" + url);
				oReq.open("GET", url);
				oReq.send();
			});
	}
	
	this.checkAndDownload = checkAndDownload;
	function checkAndDownload (askIfToDownload) { 
	
		var jarFile1 = getJar();
		Zotero.debug(jarFile1.path + " exists? " + jarFile1.exists());
		var ruleMatcherFile = getRuleMatcher();
		Zotero.debug(ruleMatcherFile.path + " exists? " + ruleMatcherFile.exists());
		var sync_jarSuccess = false;
		var sync_matcherSuccess = false;
		function downloadJar() {
			return new Promise(function (resolve, reject){
			var url1 = "http://factpub.org/public/factify/factExtractor.jar";
			Zotero.debug("send request for jar at " + Date.now() + " ");
			function fileWrite(file, data, callback) {
			    Cu.import("resource://gre/modules/FileUtils.jsm");
			    Cu.import("resource://gre/modules/NetUtil.jsm");
			    let nsFile = Components.Constructor("@mozilla.org/file/local;1", Ci.nsILocalFile, "initWithPath");
			    if (typeof file == 'string') file = new nsFile(file);
			    let ostream = FileUtils.openSafeFileOutputStream(file)
			
			    let istream = Cc["@mozilla.org/io/arraybuffer-input-stream;1"].createInstance(Ci.nsIArrayBufferInputStream);
			    istream.setData(data, 0, data.byteLength);
			
			    let bstream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
			    bstream.setInputStream(istream);
			
			    NetUtil.asyncCopy(bstream, ostream,
			      function(status) {
						if (callback) callback(Components.isSuccessCode(status));
						Zotero.debug("Writing jar at " + Date.now());
						if(Components.isSuccessCode(status)) {
							sync_jarSuccess = true;
							resolve("Success");
							return;
						}else {
							sync_jarSuccess = false;
							reject("Failed to write: " + file.path + "\r\n" + e);
							return;
						}
			      }
			    );
				}
			function getBinFile(url, dir) {
				  let nsFile = Components.Constructor("@mozilla.org/file/local;1", Ci.nsILocalFile, "initWithPath");
				  let oReq = new XMLHttpRequest();
				  oReq.open("GET", url, true);
				  oReq.responseType = "arraybuffer";
				  oReq.onload = function(oEvent) {
					Zotero.debug("Receiving jar at " + Date.now() + " with status=" + oReq.status);// + "; msg=" + oReq.responseText);
				    var arrayBuffer = oReq.response;
				    if (arrayBuffer) {
				        //let byteArray = new Uint8Array(arrayBuffer);
				        let byteArray = arrayBuffer;
				        dir = /\\$/.test(dir) ? dir: dir + '\\';
				        let file = nsFile(dir + decodeURIComponent(url.split('/').pop()));
				        fileWrite(file, byteArray);
				    }
				  };
	 				oReq.send(null);
				}
			getBinFile( url1, Zotero.getZoteroDirectory().path+"\\");
			});
	};
		function downloadRuleMatchers() {
		//if(!ruleMatcherFile.exists()){
			return new Promise(function (resolve, reject){
			var success = 0;
			var matchers = getRuleMatcherFileNames();
			for(var matcher in matchers) {
				var url2 = "http://factpub.org/public/factify/Rule_INPUT/" + matchers[matcher];
				var sent2 = Zotero.HTTP.doGet(url2, function (xmlhttp) {
					try {
						if (xmlhttp.status != 200) {
							reject("Failed to download: ");
							throw new Error("Unexpected response code " + xmlhttp.status);
							return;
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
							sync_matcherSuccess = true;
								resolve("Success");
								return;
						}
						}
					catch (e) {
						reject("Failed to download: " + xmlhttp.responseURL + "\r\n" + e);
						return;
					}
				});
			}});
		//	}
			}
		return new Promise(function(resolve, reject) {
			if(jarFile1.exists()) {
				sync_jarSuccess = true;
			}
			if(ruleMatcherFile.exists()) {
				sync_matcherSuccess = true;
			}
			Zotero.debug("1sync_jarSuccess=" + sync_jarSuccess + " sync_matcherSuccess=" + sync_matcherSuccess);
			if(sync_jarSuccess && sync_matcherSuccess) {
				resolve("Success");
				return;
			}
			//var sync_getFileSize = false;
			
			if(askIfToDownload) {
				var whichFiles = 0;
				if(!jarFile1.exists()) whichFiles = whichFiles + 1;
				if(!ruleMatcherFile.exists()) whichFiles = whichFiles + 2;//binary bit array: 
				estimateSpaceRequirement(whichFiles).then(
				function resolve_esr(fileSize) {
					var msg;
					if(fileSize < 1000000) {//less than 1MB
						var fileSize_KB = fileSize / 1000;
						fileSize_KB = Math.ceil(fileSize_KB)
						msg = "Installing Fact Extractor requires approximately " + fileSize_KB + " KB, do you want to proceed?"
					}else {
						var fileSize_MB = fileSize / 1000000;
						fileSize_MB = Math.ceil(fileSize_MB)
						msg = "Installing Fact Extractor requires approximately " + fileSize_MB + " MB, do you want to proceed?"
					}
					var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].
					createInstance(Components.interfaces.nsIPromptService);
					var buttonFlags = (ps.BUTTON_POS_0) * (ps.BUTTON_TITLE_IS_STRING)
				+ (ps.BUTTON_POS_1) * (ps.BUTTON_TITLE_CANCEL);
					Zotero.debug("disk space is " + fileSize_MB + " MB");
					var index = ps.confirm(
									null,
									"Fact Extractor NOT Installed",
									msg
								);
					if(!index) {
						reject("The user uses to cancel");
						return;
					}else {
						if(!sync_matcherSuccess){
							downloadRuleMatchers().then(function resolve_drm(msg){
								Zotero.debug("2sync_jarSuccess=" + sync_jarSuccess + " sync_matcherSuccess=" + sync_matcherSuccess);
								if(sync_jarSuccess && sync_matcherSuccess) {Zotero.debug("I'll resolve"); resolve(msg)};
							}, function reject_drm(msg){reject(msg)});
						}
						if(!sync_jarSuccess) {
							downloadJar().then(function resolve_dj(msg){if(sync_jarSuccess && sync_matcherSuccess) {resolve(msg);}}, function reject_dj(msg){reject(msg)});
						}
					}}, 
				function reject_esr(msg) {reject(msg);});
			}else {
				if(!sync_matcherSuccess){
							downloadRuleMatchers().then(function resolve_drm(msg){
								Zotero.debug("2sync_jarSuccess=" + sync_jarSuccess + " sync_matcherSuccess=" + sync_matcherSuccess);
								if(sync_jarSuccess && sync_matcherSuccess) {resolve(msg)};
							}, function reject_drm(msg){reject(msg)});
						}
						if(!sync_jarSuccess) {
							downloadJar().then(function resolve_dj(msg){if(sync_jarSuccess && sync_matcherSuccess) {resolve(msg);}}, function reject_dj(msg){reject(msg)});
						}
				return;
			}
			});
	};
	
	function canExtract(/**Zotero.Item*/ item) {
		return (item.attachmentMIMEType &&
			item.attachmentMIMEType == "application/pdf" && !item.getSource());
	};
	
	this.extractFacts = extractFacts;
	function extractFacts (file, userName) {
		var sendFactsData = function (facts_file, uri, id) {
			Zotero.debug("Enter sendFactsData at " + Date.now());
			Zotero.debug("syn: file path is " + facts_file.path + "; exists? " + facts_file.exists() + "; at " + Date.now());
			var data = Zotero.File.getContents(facts_file);
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
			var url = "http://factpub.org:8080/upload?uri=" + uri + "&id=" + id;
			Zotero.debug("sending httprequest:" + url);
			var dataBlob = new Blob([content], { type: "text/html" });
			var formData = new FormData();
			formData.append("data",dataBlob);
			oReq.open("POST", url);
			oReq.send(formData);
		};
		/*
		var checkFactsOwnership = function (paper_file, facts_file, id, uri, callback) {
			if(id == "Anonymous") {
				callback(paper_file, facts_file, uri, id);
				return;
			}
			var oReq = new XMLHttpRequest();
			function reqListener () {
				Zotero.debug("Response from server:" + this.responseText);
			}
			oReq.onreadystatechange = function (oEvent) {
			if (oReq.readyState == 4) {
				if(oReq.status == 200) {
					Zotero.debug("Done uploading %o, response is %s", oEvent, oReq.responseText);
					if(oReq.responseText.substring(0,4) == "101:") {//server error
				
					}else if (oReq.responseText.substring(0,2) == "1:") {//finished; nothing to do
						
					}else if (oReq.responseText.substring(0,2) == "0:" || oReq.responseText.substring(0,4) == "100:") {//send data
						callback(paper_file, facts_file, uri, id);
					}
				}else
					Zotero.debug("Error loading page " + oReq.status);
			}
			Zotero.debug("ready state change: readyState=" + oReq.readyState + " msg=" + oReq.responseText + " status=" + oReq.status);
			};
			oReq.addEventListener("load", reqListener);
			oReq.onload = function (oEvent) {
					Zotero.debug("Done loading %o, response is %s", oEvent, oReq.responseText);
			};
			var url = "http://factpub.org:8080/exist?uri=" + uri + "&id=" + id;
			Zotero.debug("sending httprequest:" + url);
			oReq.open("GET", url);
			oReq.send();
		};
		*/
		
		var getAndSendFactsData = function (paper_file, facts_file, uri, id) {
			//var te = Zotero.getZoteroFactsDirectory();//facts file 
			//te.append(uri + "_facts.json");
			Zotero.debug("Enter getAndSendFactsData at " + Date.now() + "; " + facts_file.path + " exists?" + facts_file.exists());
			if(facts_file.exists()) {
				sendFactsData(facts_file, uri, id);
			}else {
				getJARExecAndArgs = function () {
				var execl = getJar();
				return {
					exec: execl,
					args: []
				}
				}
				var {exec, args} = getJARExecAndArgs();
				args.push(paper_file.path);
				var outputPath = Zotero.getZoteroFactsDirectory().path + "\\";
				var debugPath = Zotero.getZoteroDirectory().path + "\\debug\\";
				var ruleMatcherPath = Zotero.getZoteroDirectory().path + "\\Rule_INPUT\\RuleMatcher.json";
				var debugLogPath = " ";
				args.push(outputPath);
				args.push(debugPath);
				args.push(ruleMatcherPath);
				args.push(debugLogPath);
				args.push(facts_file.path);
				Zotero.debug("Extracting Facts: Running " + exec.path + " " + args.map(arg => "'" + arg + "'").join(" ") + "; at "+ Date.now());
				Zotero.Utilities.Internal.exec(exec, args).then(function() {
					sendFactsData(facts_file, uri, id);
				}, function(msg) {
					var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
										.getService(Components.interfaces.nsIPromptService);
					ps.alert(
					null,
					" ",
					"An error occurred when extracting facts!\n\n"
						+ msg
					);
					Zotero.debug("error happened when extracting facts; at " + Date.now() + " errorMsg: " + msg);
				});
			}
		}
		Zotero.debug("in extractFacts: ");
		Zotero.debug("file is " + file.path + "; user is " + userName);
		//check if facts have been extracted
		Zotero.Utilities.Internal.md5Async(file).then(function (fileHash) {
			Zotero.debug("hash of " + file.path + " is " + fileHash);
			var te = Zotero.getZoteroFactsDirectory();//facts file 
			te.append(fileHash + "_facts.json");
//			checkFactsOwnership(file, te, userName, fileHash, getAndSendFactsData);
			getAndSendFactsData(file, te,fileHash, userName);
		});
	};
	this.extractAndsend = extractAndsend;
	function extractAndsend (file, checkSetting, askIfToDownload) {
		Zotero.debug("Entering Zotero.extractFacts.extractAndsend");
		if(checkSetting) {
			var cb = document.getElementById("zotero-cb-extract-facts");
			Zotero.debug("The user says no to fact extraction?" + cb.checked);
			if(!cb.checked) return;
		}
		var sync_downloads = false;
		var sync_username = false;
		//find username
		var userName;
		Zotero.Sync.Server.login_quiet().then(function(username){
			userName = username;
			//Zotero.Sync.Server.login().then(function(response){Zotero.debug("login succeeded!"); Zotero.debug(response);});
			Zotero.debug("username is " + userName);
			sync_username = true;
			Zotero.debug("after username_quiet(): sync_username=" + sync_username + "; sync_downloads=" + sync_downloads);
			if(sync_downloads) {
				Zotero.debug("ready to extract facts:");
				Zotero.debug("file=" + file.path);
				Zotero.debug("userName=" + userName);
				extractFacts(file, userName);
			}
		});
			
		checkAndDownload(askIfToDownload).then(function resolve(response) {
		try{	
			sync_downloads = true;
			Zotero.debug("after checkAndDownload(): sync_username=" + sync_username + "; sync_downloads=" + sync_downloads);
			if(sync_username) {
				Zotero.debug("Ready to extract Facts");
				extractFacts(file, userName);
			}
			}
		catch(e) {
			Zotero.debug("error");
			Zotero.debug(e)
		}
		},function reject(response) {
			Zotero.debug("downloading failed: " + response);
			var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
										.getService(Components.interfaces.nsIPromptService);
					ps.alert(
					null,
					" ",
					"Failed to download necessary factExtractor files. \n\n"
						+ response
				);
			sync_downloads = false;
		});
	};
	
	this.startExtractAndSend = startExtractAndSend;
	function startExtractAndSend(askIfToDownload) {
		Zotero.debug("Entering startExtractAndSend");
		var items = ZoteroPane_Local.getSelectedItems();
		if (!items) {
			Zotero.debug("No item is selected.");
			return;
		} 
		this._items = [];
		this._items = items.slice();
		var nonpdfs = 0;
		var total = 0;
		while(true) {
			if(!this._items.length) break;
			var item = this._items.shift();
			total = total + 1;
			if(canExtract(item)) {
				var file = item.getFile();
				Zotero.debug("Target file: " + file.path);
				extractAndsend(file, false, askIfToDownload);
			}else {
				nonpdfs = nonpdfs + 1;
				Zotero.debug("A non-pdf is selected to extract facts.");
			}
		}
		var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].
				createInstance(Components.interfaces.nsIPromptService);
		if(nonpdfs != 0 && nonpdfs == total) {	
			ps.alert(
			null,
			" ",
			"None of the selected files are PDF files. No facts are extracted!"
			);
		}
		else {
			var msg;
			if(total - nonpdfs > 1) msg = "Facts of " + (total - nonpdfs) + " PDF files are being extracted in background.";
			else msg = "Facts of " + (total - nonpdfs) + " PDF file is being extracted in background."
			ps.alert(
			null,
			" ",
			msg
			);
		}
	};
	
	this.extractFactsSelected = function() {
		var jarFile1 = getJar();
		var ruleMatcherFile = getRuleMatcher();
		var whichFiles = 0;
		if(!jarFile1.exists()) {
			whichFiles = whichFiles + 1;
		}
		if(!ruleMatcherFile.exists()) {
			whichFiles = whichFiles + 2;//binary bit array:
		}
		if(whichFiles > 0) {
			estimateSpaceRequirement(whichFiles).then(function resolve(fileSize){
				var msg;
				if(fileSize < 1000000) {//less than 1MB
					var fileSize_KB = fileSize / 1000;
					fileSize_KB = Math.ceil(fileSize_KB)
					msg = "Installing Fact Extractor requires approximately " + fileSize_KB + " KB, do you want to proceed?"
				}else {
					var fileSize_MB = fileSize / 1000000;
					fileSize_MB = Math.ceil(fileSize_MB)
					msg = "Installing Fact Extractor requires approximately " + fileSize_MB + " MB, do you want to proceed?"
				}
				var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].
				createInstance(Components.interfaces.nsIPromptService);
				Zotero.debug("disk space is " + fileSize_MB + " MB");
				var index = ps.confirm(
					null,
					"Fact Extractor NOT Installed",
					msg
				);
				if(!index) {
					return; 
				}
				else {
					startExtractAndSend(false);
				}}, function reject(fileSize){Zotero.debug("Exit extractFactsSelected with msg " + fileSize)});
		}else {
			startExtractAndSend(false);
		}
	};
};
Zotero.extractFacts = Zotero_extractFacts;