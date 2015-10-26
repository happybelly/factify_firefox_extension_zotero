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
	}
	
	
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
		getJARExecAndArgs = function () {
			var execl = Zotero.getZoteroDirectory();
//			execl.append("testJARForZotero.jar");
			execl.append("testBatch4.jar");
		return {
			exec: execl,
			args: []
		}
		}
		var {exec, args} = getJARExecAndArgs();
		//args.push("zotero in firefox");
		args.push(file.path);
		var outputPath = Zotero.getZoteroDirectory().path + "\\output\\";
		var debugPath = Zotero.getZoteroDirectory().path + "\\debug\\";
		var ruleMatcherPath = Zotero.getZoteroDirectory().path + "\\Rule_INPUT\\RuleMatcher.json";
		var debugLogPath = Zotero.getZoteroDirectory().path + "\\debug.txt";

		args.push(outputPath);
		args.push(debugPath);
		args.push(ruleMatcherPath);
		args.push(debugLogPath);
		Zotero.debug("Extracting Facts: Running " + exec.path + " " + args.map(arg => "'" + arg + "'").join(" "));

		Zotero.Utilities.Internal.exec(exec, args);
		}
		return true;
	 	/*var installed = ZoteroPane_Local.checkPDFConverter();
		if (!installed) {
			return;
		}
		
		var items = ZoteroPane_Local.getSelectedItems();
		if (!items) return;
		var itemRecognizer = new Zotero_RecognizePDF.ItemRecognizer();
		itemRecognizer.recognizeItems(items); */
	}	
}