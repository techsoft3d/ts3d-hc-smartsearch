import { SQueryEditor } from './SQueryEditor.js';

export class SQueryResults {

    static initialize(maindiv, manager) {
        SQueryResults._maindiv = maindiv;
        SQueryResults._manager = manager;      
        SQueryResults._viewer = manager._viewer;
        SQueryResults._isPropertyView = false;
    }

    static async display() {
        let html = "";
        html +='<div id = "SQueryResultsFirstRow" style="position:relative;width:100%;height:20px;top:-8px">';
        html += '<div style="position:absolute; left:0px;top:5px; font-size:14px;background-color:white" id="' + SQueryResults._maindiv + '_found"></div>';  
        html += SQueryResults._generateDropdown();
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick=\'hcSQueryUI.SQueryEditor.selectAll(this)\'>Select</button>';
        html += '<button id="SQueryToggleViewButton" class="SQuerySearchButton" type="button" style="right:90px;top:3px;position:absolute;" onclick=\'hcSQueryUI.SQueryResults.toggleView(this)\'>Property View</button>';
        html += '</div>';

        html += '<div id="' + SQueryResults._maindiv + '_searchitems" class="SQuerySearchItems">';        
        html += '</div>';
        html += '<div style="position:absolute; right:20px;bottom:0px; font-size:12px;background-color:white" id="' + SQueryResults._maindiv + '_found"></div>';  
        
        $("#" + SQueryResults._maindiv).empty();
        $("#" + SQueryResults._maindiv).append(html);

        const SQueryDropdowButton = document.querySelector('#SQueryResultsDropdown');
        const SQueryDropdowContent = document.querySelector('#SQueryResultsDropdownContent');

        SQueryDropdowButton.addEventListener('click', function () {
            SQueryDropdowContent.classList.toggle('SQueryDropdowShow');
        });

        window.addEventListener('click', function (event) {
            if (!event.target.matches('.SQueryDropdow-button')) {
                if (SQueryDropdowContent.classList.contains('SQueryDropdowShow')) {
                    SQueryDropdowContent.classList.remove('SQueryDropdowShow');
                }
            }
        });
        
    }

    static _findCategoryFromSearch() {

        let query = SQueryEditor._mainFilter;
        let searchresults = SQueryEditor._founditems;
        SQueryResults._categoryHash = [];

        if (SQueryResults._tableProperty) {
            if (SQueryResults._tableProperty == "Node Name") {
                for (let j = 0; j < searchresults.length; j++) {
                    if (SQueryResults._categoryHash[searchresults[j].name] == undefined) {
                        SQueryResults._categoryHash[searchresults[j].name] = [];
                    }
                    SQueryResults._categoryHash[searchresults[j].name].push(searchresults[j].id);
                }
            }
            else {
                let propname = SQueryResults._tableProperty
                for (let j = 0; j < searchresults.length; j++) {
                    let id = searchresults[j].id;
                    if (SQueryResults._manager._propertyHash[id][propname] != undefined) {
                        if (SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][propname]] == undefined) {
                            SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][propname]] = [];
                        }
                        SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][propname]].push(searchresults[j].id);
                    }
                }
            }
        }
        else {

            for (let i = 0; i < query.getNumConditions(); i++) {
                let condition = query.getCondition(i);
                if (condition.propertyType == hcSQuery.SQueryPropertyType.nodeName) {
                    for (let j = 0; j < searchresults.length; j++) {
                        if (SQueryResults._categoryHash[searchresults[j].name] == undefined) {
                            SQueryResults._categoryHash[searchresults[j].name] = [];
                        }
                        SQueryResults._categoryHash[searchresults[j].name].push(searchresults[j].id);
                    }
                    SQueryResults._tableProperty = "Node Name";
                    return;
                }
                else if (condition.propertyType == hcSQuery.SQueryPropertyType.property) {
                    let propname = condition.propertyName;
                    for (let j = 0; j < searchresults.length; j++) {
                        let id = searchresults[j].id;
                        if (SQueryResults._manager._propertyHash[id][condition.propertyName] != undefined) {
                            if (SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][condition.propertyName]] == undefined) {
                                SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][condition.propertyName]] = [];
                            }
                            SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][condition.propertyName]].push(searchresults[j].id);
                        }
                    }
                    SQueryResults._tableProperty = propname;
                    return;
                }
            }
        }
    }


    static getAllProperties() {

        let searchresults = SQueryEditor._founditems;
        let propsnames = [];
        let thash = [];
        for (let i in SQueryResults._manager._allPropertiesHash) {
            propsnames.push(i);
        }

        for (let j = 0; j < searchresults.length; j++) {
            let id = searchresults[j].id;
            for (let k in SQueryResults._manager._propertyHash[id]) {
                thash[k] = true;
            }
        }

        let propnames2 = [];
        for (let i = 0; i < propsnames.length; i++) {
            if (thash[propsnames[i]] != undefined) {
                propnames2.push(propsnames[i]);
            }
        }

        propnames2.sort();
        propnames2.unshift("Node Name");
        return propnames2;
    }

    static _propertySelected() {
        SQueryResults._tableProperty = $("#SQueryPropSelect")[0].value;
        SQueryResults._generatePropertyView();

    }

    static _generatePropertyView() {

        let sortedStrings = SQueryResults.getAllProperties();

        let found = false;
        if (SQueryResults._tableProperty)  {            
            for (let i=0;i<sortedStrings.length;i++) {
                if (sortedStrings[i] == SQueryResults._tableProperty) {
                    found = true;
                    break;
                }
            }           
        }
        if (!found) {
            SQueryResults._tableProperty = null;
        }
        
        SQueryResults._findCategoryFromSearch();

    
        $("#SQueryToggleViewButton").html("Item View");

        $("#" + SQueryResults._maindiv + "_searchitems").empty();
        $("#" + SQueryResults._maindiv + "_found").empty();


        let html = '<div style="height:25px;">Prop Select:<select id="SQueryPropSelect" onchange=\'hcSQueryUI.SQueryResults._propertySelected();\' class="SQueryPropertyTypeSelect" value="">';       

       
        for (let i = 0; i < sortedStrings.length;i++) {
            if (SQueryResults._tableProperty == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></div>';

        $("#" + SQueryResults._maindiv + "_searchitems").append(html);

        $("#" + SQueryResults._maindiv + "_searchitems").append('<div id = "SQueryResultsTabulator"></div>');

        SQueryResults._table = new Tabulator("#SQueryResultsTabulator", {
            selectable: 0,
            layout: "fitColumns",
            columns: [
                {
                    title: SQueryResults._tableProperty, field: "name"
                },
                {
                    title: "#", field: "num", width: 30
                },
                {
                    title: "ID", field: "id", width: 20, visible: false
                },

            ],
        });

        SQueryResults._table.on("rowClick", async function (e, row) {
            let data = row.getData();

            let ids = SQueryResults._categoryHash[data.id];
            SQueryResults._viewer.selectionManager.clear();
            let selections = [];
            for (let i = 0; i < ids.length; i++) {
                selections.push(new Communicator.Selection.SelectionItem(ids[i]));
            }
            SQueryResults._viewer.selectionManager.add(selections);

        });


        SQueryResults._table.on("tableBuilt", function () {

            let tdata = [];
            for (let i in SQueryResults._categoryHash) {
                tdata.push({ name: i, num: SQueryResults._categoryHash[i].length, id: i });
            }
            SQueryResults._table.setData(tdata);
        });


    }

    static toggleView() {
        SQueryResults._isPropertyView = !SQueryResults._isPropertyView;
        if (SQueryResults._isPropertyView) {
            SQueryResults._generatePropertyView();
        }
        else {
            SQueryResults.generateSearchResults(SQueryEditor._founditems);
        }
    }
    

    static generateSearchResults(founditems) {
        $("#SQueryToggleViewButton").html("Property View");
        SQueryResults._isPropertyView = false;
        $("#" + SQueryResults._maindiv + "_searchitems").empty();
        $("#" + SQueryResults._maindiv + "_found").empty();
        if (founditems == undefined)
            return;

        $("#" + SQueryResults._maindiv + "_found").append("Found:" + founditems.length);

        let html = "";
        let y = 0;
        let toggle = true;

        let more = false;
        let lend = founditems.length;
        if (founditems.length > 2000) {
            lend = 2000;
            more = true;
        }

        for (let i = 0; i < lend; i++) {
            toggle = !toggle;
            if (SQueryResults._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(founditems[i].id))) {
                let parent = SQueryResults._viewer.model.getNodeParent(SQueryEditor._founditems[i].id);
                if (SQueryResults._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(parent))) {
                    html += '<div onclick=\'hcSQueryUI.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItemselectedIndirect">';
                }
                else {
                    html += '<div onclick=\'hcSQueryUI.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItemselected">';
                }
            }
            else {
                if (toggle)
                    html += '<div onclick=\'hcSQueryUI.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItem1">';
                else
                    html += '<div onclick=\'hcSQueryUI.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItem2">';
            }

            html += '<div class="SQuerySearchItemText">' + SQueryEditor._htmlEncode(founditems[i].name) + '</div>';
            html += '<div class="SQuerySearchItemChainText">' + SQueryEditor._htmlEncode(founditems[i].chaintext) + '</div>';
            html += '</div>';
            y++;
        }
        if (more) {
            html += '<div style="left:3px;" >More...</div>';
        }

        $("#" + SQueryResults._maindiv + "_searchitems").append(html);


        SQueryResults.adjust();
    }

    static adjust() 
    {

        let newheight = $("#" + SQueryEditor._maindiv).height() - ($("#" + SQueryResults._maindiv + "_searchitems").offset().top - $("#" + SQueryEditor._maindiv).parent().offset().top);
        $("#" + SQueryResults._maindiv + "_searchitems").css({ "height": newheight + "px" });
        

        let gap  = newheight + $("#" + SQueryEditor._maindiv + "_conditions").height() + 3;
        if (SQueryEditor._showFirstRow) {
            gap += $("#" + SQueryEditor._maindiv + "_firstrow").height();
        }
    }

    
    static _select(id) {
        if (!SQueryEditor.ctrlPressed)
            SQueryResults._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Set);
        else
            SQueryResults._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Toggle);
       
        SQueryResults.generateSearchResults(SQueryEditor._founditems);
    }

    static _generateDropdown() {
        let html = "";
        html += '<button id="SQueryResultsDropdown" style="right:56px;top:3px;position:absolute;" class="SQuerySearchButton SQueryDropdow-button">...</button>';
        html += '<ul  id="SQueryResultsDropdownContent" style="right:22px;top:10px;position:absolute;" class="SQueryDropdow-content">';
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.selectAll(this)\'>Select</li>';
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.isolateAll(this)\'>Isolate</li>';        
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.makeVisible(true)\'>Show</li>';        
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.makeVisible(false)\'>Hide</li>';        
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.resetModel()\'>Reset Model</li>';        
        html +='<li >---</li>';        
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.colorize(new Communicator.Color(255,0,0))\'>Red</li>';        
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.colorize(new Communicator.Color(0,255,0))\'>Green</li>';        
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.colorize(new Communicator.Color(0,0,255))\'>Blue</li>';        
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.colorize(new Communicator.Color(255,255,0))\'>Yellow</li>';        
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.colorize(new Communicator.Color(128,128,128))\'>Grey</li>';        
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.setOpacity(0.7)\'>Transparent</li>';        
        html +='<li onclick=\'hcSQueryUI.SQueryEditor.setOpacity(1)\'>Opaque</li>';        
        html += '</ul>';
        return html;
    }

}