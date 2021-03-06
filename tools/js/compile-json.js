/*
 * Load Dependencies
 */
var include = function(path){
	var file = undefined,
	line     = '',
	text     = '';
	if (typeof ActiveXObject != 'undefined'){
		file = new ActiveXObject("Scripting.FileSystemObject").OpenTextFile(path);
		text = file.ReadAll();
		file.Close();
	} else {
    	file = new java.io.BufferedReader(new java.io.FileReader(path));
    	while ((line = file.readLine()) != null) {
		  text += new String(line) + '\n';
		}
    	file.close();
	}
	eval(text);
};
include('js/file-io.js');  // Including support for either ActiveX or Rhino file and shell support.
include('js/json2.js');    // Including json2.js to support JSON if it doesn't exist.

/*
 * Compile JSON files into a single configuration file
 */

(function(){
    var alert  = function(val){print(val);},
    engineComponent = (function(){
    	// This is a list of all the components in the engine. This list must be updated as new components are added. Also update "game/default.js".
    	var components = ["asset-loader"
   	                  , "audio"
   	                  , "broadcast-events"
   	                  , "camera"
   	                  , "camera-follow-me"
   	                  , "change-scene"
   	                  , "collision-basic"
	                  , "collision-box2d"
   	                  , "collision-filter"
   	                  , "collision-group"
   	                  , "collision-tiles"
   	                  , "component-switcher"
   	                  , "counter"
   	                  , "dom-element"
   	                  , "enable-ios-audio"
   	                  , "entity-container"
   	                  , "entity-controller"
   	                  , "entity-linker"
   	                  , "format-message"
   	                  , "fullscreen"
   	                  , "handler-ai"
	                  , "handler-box2d"
   	                  , "handler-collision"
   	                  , "handler-controller"
   	                  , "handler-logic"
   	                  , "handler-render-createjs"
   	                  , "handler-render-dom"
   	                  , "level-builder"
   	                  , "logic-angular-movement"
   	                  , "logic-attached-entity"
   	                  , "logic-button"
   	                  , "logic-carrier"
   	                  , "logic-delay-message"
   	                  , "logic-destroy-me"
   	                  , "logic-directional-movement"
   	                  , "logic-drag-and-droppable"
   	                  , "logic-fps-counter"
   	                  , "logic-gravity"
   	                  , "logic-impact-launch"
   	                  , "logic-jump"
   	                  , "logic-pacing-platform"
   	                  , "logic-portable"
   	                  , "logic-portal"
   	                  , "logic-pushable"
   	                  , "logic-rebounder"
   	                  , "logic-region-spawner"
   	                  , "logic-rotational-movement"
   	                  , "logic-shield"
   	                  , "logic-spawner"
   	                  , "logic-state-machine"
   	                  , "logic-switch"
   	                  , "logic-teleportee"
   	                  , "logic-teleporter"
   	                  , "logic-timer"
   	                  , "logic-wind-up-racer"
   	                  , "node-map"
   	                  , "node-resident"
   	                  , "random-events"
   	                  , "render-debug"
   	                  , "render-destroy-me"
	                  , "render-animation" //deprecated - points to "render-sprite"
	                  , "render-image"     //deprecated - points to "render-sprite"
   	                  , "render-sprite"
   	                  , "render-tiles"
   	                  , "tiled-loader"
   	                  , "tween"
   	                  , "voice-over"
   	                  , "xhr"
   	                  , "ai-chaser"
   	                  , "ai-pacer"];
   	return function(id){
   		var i = 0;
   		
   		for (; i < components.length; i++){
   			if(components[i] === id){
       			return true;    			
   			}
   		}
   		return false;
       };
   })(),
   getText    = function(path){
	   var file = undefined,
	   text     = '';
	   try {
		   file = fileSystem.OpenTextFile(path);
		   try {
			   text = file.ReadAll();
		   } catch(e){
			   alert('Error reading from "' + path + '": ' + e.description);
		   }
		   file.Close();
	   } catch (e) {
		   alert('Error opening "' + path + '": ' + e.description);
	   }
	   return text;
   },
   getJSON    = function(path){
	   try{
		   return eval('(' + getText(path) + ')'); //Using "eval" to allow comments in JSON definition files
	   } catch(e) {
		   alert('Error in "' + path + '": ' + e.description);
		   return {};
	   }
   },
   setText    = function(path, text){
	   var file = fileSystem.CreateTextFile(path, true);
	   file.Write(text);
	   file.Close();
	   return text;
   },
   setJSON    = function(path, obj){return setText(path, JSON.stringify(obj));},
   getSubDir  = function (path){
	   var arr = undefined, subDir = '';
	   if(path.indexOf('/') > -1){
		   arr = path.split('/');
		   for (var i = 0; i < arr.length - 1; i++){
			   subDir += arr[i] + '/'; 
		   }
	   }
	   return subDir;
   },
   fixUpPath  = function(path) {
	   var arr = undefined, preArr = [], postArr = [];
	   if(path.indexOf('/') > -1){
		   arr = path.split('/');
		   postArr = arr.slice();
		   postArr.splice(0,1);
		   for (var i = 1; i < arr.length; i++){
			   postArr.splice(0,1);
			   if((arr[i] === '..') && (arr[i - 1] !== '..')){
				   return fixUpPath(preArr.join('/') + '/' + postArr.join('/'));
			   } else {
				   preArr.push(arr[i - 1]);
			   }
		   }
		    return arr.join('/');
	    }
	    return path;
   },
   isJSON     = function(path){
	   var check = path.substring(path.length - 4).toLowerCase();
	   return (check === 'json');
   },
   isJS       = function(path){
	   var check = path.substring(path.length - 3).toLowerCase();
	   return (check === '.js');
   },
   checkComponent = function(component){
   	   var j   = 0,
 	   found   = false,
 	   file    = null;
    	
	   if(component){
		   for(j = 0; j < componentList.length; j++){
			   if((component === componentList[j]) || (component === componentList[j].id)){
				   found = true;
				   break;
			   }
		   }
		   if(!found){
			   if(engineComponent(component)){
				   file = {
				       id: component,
				       src: '../engine/components/' + component + '.js'
				   };
				   componentList.push(file);
				   checkDependencies(file);
			   } else {
				   file = {
				       id: component,
				       src: 'components/' + component + '.js'
				   };
				   componentList.push(file);
				   checkDependencies(file);
			   }
		   }
	   }
    },
    checkComponents = function(components){
  	   for(var i = 0; i < components.length; i++){
  		   
		   checkComponent(components[i].type);
		   
		   if(components[i].entities){ // check these entities for components
			   for(var j = 0; j < components[i].entities.length; j++){
				   if(components[i].entities[j].components){
					   checkComponents(components[i].entities[j].components);
				   }
			   }
		   }
	   }
    },
    checkDependencies = function(asset){
  	   var i   = 0,
  	   j       = 0,
  	   text    = '',
  	   matches = null,
  	   found   = false,
  	   subDir  = '',
  	   file    = '',
  	   arr     = null;
  	   
  	   if(typeof asset === 'string'){ //JS File
  		   if(asset.substring(0,4).toLowerCase() !== 'http'){
  	 		   subDir = getSubDir(asset);
  	 		   text = getText(asset);
  	 		   matches = text.match(/[Rr]equires:\s*\[[\w"'.\\\/, \-_:]*\]/g);
  	 		   if(matches && matches.length){
  	 			   try {
  	 				   arr = JSON.parse(matches[0].match(/\[[\w"'.\\\/, \-_:]*\]/g)[0]);
  	 			   } catch(e) {
  	 				   alert("Error in '" + asset + "': Dependency list is malformed.");
  	 				   return;
  	 			   }
  	 	 		   if(isJS(arr[i])){ // Is this a JavaScript path name?
  	 	 			   for(i = 0; i < arr.length; i++){
  	 	 				   found = false;
  	 	 				   if(arr[i].substring(0,4).toLowerCase() === 'http'){
  	 	 					   file = arr[i];
  	 	 				   } else {
  	 	 	 				   file = fixUpPath(subDir + arr[i]);
  	 	 				   }
  	 	 				   for(j = 0; j < dependencyList.length; j++){
  	 	 					   if((file === dependencyList[j]) || (file === dependencyList[j].src)){
  	 	 						   found = true;
  	 	 						   break;
  	 	 					   }
  	 	 				   }
  	 	 				   if(!found){
  	 	 					   dependencyList.push(file);
  	 	 					   checkDependencies(file);
  	 	 				   }
  	 	 			   }
  	 	 		   } else { // assume it's a component id since it's not a JavaScript path name.
  	 	 			   checkComponent(arr[i]);
  	 	 		   }
  	 		   }
  		   }
  	   } else if (asset){ //should be a JSON object
  		   if(asset.components){
  			   checkComponents(asset.components);
  		   } else if(asset.layers){
  			   for (var i = 0; i < asset.layers.length; i++){
  				   if(asset.layers[i].components){
  		 			   checkComponents(asset.layers[i].components);
  				   }
  			   }
  		   }
  	   }
     },
   handleList = function(section, sectionId, workingDir){
	    var subDir     = '',
	    asset      = undefined,
	    assetId    = 0,
	    retainId   = '',
	    srcId      = '';

	    for (; assetId < section.length; assetId++){
	    	asset = section[assetId];
		    try {
		    	if(typeof asset === 'string'){
		    		if(asset.substring(0,4).toLowerCase() !== 'http'){
			    		if(isJSON(asset)){
			    			print('....Filling in data for "' + asset + '"');
			    			retainId = asset;
						    subDir = workingDir + getSubDir(asset);
						    asset  = getJSON(workingDir + asset);
		    				checkDependencies(asset);
						    if(asset.tilesets){
		 				    	for (var ts in asset.tilesets){
								    if(asset.tilesets[ts].image) asset.tilesets[ts].image = fixUpPath(subDir + asset.tilesets[ts].image);
							    }
		 				    }
		 				    asset.id = asset.id || retainId;
			    		} else {
		    			    asset = {src: fixUpPath(workingDir + asset), id: asset};
			    			if(isJS(asset.src)){
			    				checkDependencies(asset.src);
			    			}
			    		}
		    		} else {
		    			asset = {src: asset, id: asset};
		    		}
		    	} else if(asset.src){
			    	if(typeof asset.src === 'string'){
			    		if(asset.src.substring(0,4).toLowerCase() !== 'http'){
				    		if(isJSON(asset.src)){
				    			print('....Filling in data for "' + asset.id + '" from "' + asset.src + '"');
				    			retainId = asset.id;
							    subDir = workingDir + getSubDir(asset.src);
							    asset  = getJSON(workingDir + asset.src);
			    				checkDependencies(asset);
							    if(asset.tilesets){
			 				    	for (var ts in asset.tilesets){
									    if(asset.tilesets[ts].image) asset.tilesets[ts].image = fixUpPath(subDir + asset.tilesets[ts].image);
								    }
			 				    }
			 				    asset.id = asset.id || retainId;
				    		} else {
			    			    asset.src = fixUpPath(workingDir + asset.src);
				    			if(isJS(asset.src)){
				    				checkDependencies(asset.src);
				    			}
				    		}
			    		}
			    	} else {
			    		for(srcId in asset.src){
					    	if((typeof asset.src[srcId]) == 'string'){
					    		if(asset.src[srcId].substring(0,4).toLowerCase() !== 'http'){
				    			    asset.src[srcId] = fixUpPath(workingDir + asset.src[srcId]);
					    		}
					    	} else {
					    		if(asset.src[srcId].src.substring(0,4).toLowerCase() !== 'http'){
				    			    asset.src[srcId].src = fixUpPath(workingDir + asset.src[srcId].src);
					    		}
					    	}
			    		}
			    	}
			    }
			    game.source[sectionId][assetId] = asset;
		    } catch(e) {
			    alert('Error in processing "' + sectionId + ' ' + assetId + '": ' + e.description);
		    }
	    }
   },
   compConfig = getJSON('tools-config.json'),
   workingDir = compConfig["source-folder"] || '../game/',
   gameConfig = getText(workingDir + 'config.json'),
   game       = eval('(' + gameConfig + ')'), //Using "eval" to allow comments in JSON config file
   source     = game.source,
   dependencyList = source['includes']  = source['includes'] || ['../engine/main.js'],
   componentList = source['components'] = source['components'] || [],
   sectionId  = '';
    
    print('Composing full config.json from ' + workingDir + 'config.json.');
    
    for(sectionId in source){
    	if((sectionId !== 'includes') && (sectionId !== 'components')){
        	print('..Handling "' + sectionId + '" section.');
        	handleList(source[sectionId], sectionId, workingDir);
    	}
    }
	print('..Handling Components.'); // need to process after entities
	handleList(componentList, "components", workingDir);
	print('..Handling Dependencies.');
	handleList(dependencyList, "includes", workingDir);
   
    game.toolsConfig = compConfig || {}; //save compile information for compilation tools that use this configuration.

    //insert entities and scenes into compiled config file
    setJSON('config.json', game);
    print('Completed full config.json.');
})();
