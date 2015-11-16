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
	
	this.canExtract = function(/**Zotero.Item*/ item) {
		return (item.attachmentMIMEType &&
			item.attachmentMIMEType == "application/pdf" && !item.getSource());
	};
	this.extractAndsend = function(file) {
		getJARExecAndArgs = function () {
			var execl = Zotero.getZoteroDirectory();
			execl.append("testBatch5.jar");
		return {
			exec: execl,
			args: []
		}
		}
		var {exec, args} = getJARExecAndArgs();
		//args.push("zotero in firefox");
		args.push(file.path);
		var outputPath = Zotero.getZoteroDirectory().path + "\\facts_storage\\";
		var debugPath = Zotero.getZoteroDirectory().path + "\\debug\\";
		var ruleMatcherPath = Zotero.getZoteroDirectory().path + "\\Rule_INPUT\\RuleMatcher.json";
		var debugLogPath = Zotero.getZoteroDirectory().path + "\\debug.txt";

		args.push(outputPath);
		args.push(debugPath);
		args.push(ruleMatcherPath);
		args.push(debugLogPath);
		Zotero.debug("Extracting Facts: Running " + exec.path + " " + args.map(arg => "'" + arg + "'").join(" "));
		Zotero.Utilities.Internal.exec(exec, args);
		var filePath = file.path.replace(/^.*[\\\/]/, '') + "_facts.json";
		var te = Zotero.getZoteroFactsDirectory();
		//Zotero.debug("facts folder is " + te.path);
		//Zotero.debug("facts file is " + filePath);
		te.append(filePath);
		Zotero.debug("sending file: " + te.path);
		Components.utils.import("resource://gre/modules/NetUtil.jsm");
		NetUtil.asyncFetch(te, function(inputStream, status) {
			// The file data is contained within inputStream.
			// You can read it into a string with
			var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
			if (!Components.isSuccessCode(status)) {
				// Handle error!
				Zotero.debug("error in asyncFetch " + status);
				return;
			}else {
				//Zotero.debug("sucess: data is " + data);
				var oReq = new XMLHttpRequest();
				function reqListener () {
					Zotero.debug("Response from server:" + this.responseText);
				}
				oReq.onreadystatechange = function (aEvt) {
				if (oReq.readyState == 4) {
					if(oReq.status == 200)
						Zotero.debug(oReq.responseText);
					else
						Zotero.debug("Error loading page " + oReq.status);
				}
				//Zotero.debug("ready state change: readyState=" + oReq.readyState + " msg=" + oReq.responseText + " status=" + oReq.status);
				};
				//oReq.addEventListener("load", reqListener);
				//oReq.onload = function (oEvent) {
					//	Zotero.debug("Done loading %o, response is %o", oEvent, oReq.response);
					//};
				var content= data;
				//Zotero.debug("sending data: \r\n" + content);
				var dataBlob = new Blob([content], { type: "text/html" });
				var formData = new FormData();
				formData.append("data",dataBlob);
				oReq.open("POST", "http://52.5.78.150:8080/upload?uri=" + filePath);
				oReq.send(formData);
			}
		});
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