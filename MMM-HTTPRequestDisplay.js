/* Module */

/* Magic Mirror
 * Module: MMM-HTTPRequestDisplay
 *
 * By Eunan Camilleri eunancamilleri@gmail.com
 * v1.0 23/06/2016
 * MIT Licensed.
 */

Module.register("MMM-HTTPRequestDisplay",{

	// Default module config.
	defaults: {
		updateInterval: 10000, // every 10 seconds
		initialLoadDelay: 2500, // 2.5 seconds delay
		retryDelay: 2500, // retry delay
		animationSpeed: 2500, // animation speed
		httpRequestURL: ""
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);
		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);
		this.nodeNames = "";
		this.updateTimer = null;
		this.nodes = [];
		this.currentValueIndex = 0;
		this.failureFlag = "";
		this.status = "";
		this.requestComplete;

		// Schedule update timer.
		var self = this;
		setInterval(function() {
			self.updateDom(self.config.animationSpeed);
		}, this.config.updateInterval);
		self.updateRequest();
	},

	// Define required scripts.
	getScripts: function() {
		return ["httpreqdisplay.css"];
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");
		var childNodes = document.createElement("div");

		var span = document.createElement("span");
		span.innerHTML = "&nbsp;";

		if(this.config.httpRequestURL === null || this.config.httpRequestURL === ""){
			wrapper.innerHTML = "Please set your request URL target in your config file</br>See ReadMe for more information";

		}

		// Signals an issue with the HTTP Requeset
		else if(this.failureFlag){
			wrapper.innerHTML = "HTTP Request Failed. Status : " + this.status + "</br>Please check the request URL in the module config";
		}

		// Checks for results
		else if(this.nodes == undefined || this.nodes.length === 0){
			if(this.requestComplete){
			wrapper.innerHTML = "No Results";
			}
			else {
				wrapper.innerHTML = "Awaiting Results..."
			}
		}
		else {

			// Grabs the next value in our results
			var nextValue = this.getNextValue();

			// Wrap the title of the node and add it to the wrapper
			wrapper.appendChild(this.wrapNodeTitle(nextValue[0]));
			wrapper.appendChild(span);

			//Add and display attributes
			for(var x = 0; x < nextValue[1].length; x++){
				wrapper.appendChild(this.wrapAttribute(nextValue[1][x]));
			}

		}

		return wrapper;
	},

	wrapNodeTitle : function(node){
		var nodeTitle, nodeValue, container;
		container = document.createElement("div");
		nodeTitle = node[0];
		if(node[1] === null){
			nodeValue = "";
		}
		else {
			nodeValue = " : " + node[1];
		}
		container.className = "node-title center";
		container.innerHTML = nodeTitle + nodeValue;
		return container;
	},

	wrapAttribute : function(attribute){
		var container, attributeTitle, attributeValue;
		attributeTitle = attribute[0];
		container = document.createElement("div");
		if(attribute[1] === null){
			attributeValue = "No Value";
		}
		else {
			attributeValue = " : " + attribute[1];
		}
		container.className = "attribute-title bright small center";
		container.innerHTML = attributeTitle + attributeValue;

		return container;
	},

	getNextValue : function(){
		var index = this.currentValueIndex;
		if(this.currentValueIndex + 1 === this.nodes.length-1){
			this.currentValueIndex = 0;
		}
		else {
			this.currentValueIndex++;
		}
		return this.nodes[index];
	},


updateRequest: function() {
	var self = this;
	var retry = true;

	var xhttp = new XMLHttpRequest();
	xhttp.open("GET", this.config.httpRequestURL, true);
	xhttp.onreadystatechange = function() {
		if (this.readyState === 4) {
			if (this.status === 200) {
				self.requestComplete = true;
				self.processData(this.responseXML);
				self.updateDom(self.config.animationSpeed);
			}
			else {
				self.failureFlag = true;
				self.status = this.status;
				self.updateDom(self.config.animationSpeed);
			}

			if (retry) {
				self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
			}
		}
	};
	xhttp.send();
},

processData: function(data) {
	this.nodes = [];
	var x = data.documentElement.childNodes;
		for (i = 0; i < x.length ;i++) {
			var attributes = [];
			for(j = 0; j < x[i].attributes.length; j++){
				attributes.push([x[i].attributes[j].nodeName, x[i].attributes[j].nodeValue]);
			}
			this.nodes.push([[x[i].nodeName, x[i].nodeValue], attributes]);
		}
		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
},

scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.updateRequest();
		}, nextLoad);
	}

});
