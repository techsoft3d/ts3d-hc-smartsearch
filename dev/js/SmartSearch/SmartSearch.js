import { SmartSearchCondition } from './SmartSearchCondition.js';
import { SmartSearchConditionType } from './SmartSearchCondition.js';
import { SmartSearchRelationshipType } from './SmartSearchCondition.js';
import { SmartSearchPropertyType } from './SmartSearchCondition.js';
import { SmartSearchResult } from './SmartSearchResult.js';

export class SmartSearch {
    constructor(manager, startnode) {
        this._manager = manager;
        this._viewer = this._manager._viewer;
        this._limitselectionlist = [];
        this._conditions = [];
        this._name = "";
        this._action = ["",""];
        this._keepSearchingChildren = false;
        this._prop = false;
        this._autoColors = null;
        this._id = this._generateGUID();
        this._searchCounter = 0;
        this._autoColorsProperty = null;
        if (startnode)
            this._startnode = startnode;
        else
            this._startnode = this._viewer.model.getRootNode();
    }


    getAction(slot=0) {
        return this._action[slot];
    }

    setAction(action,slot=0) {
        this._action[slot] = action;
    }

    hasAction() {
        if (this._action[0] == "" && this._action[1] == "") {
            return false;
        }
        else {
            return true;
        }

    }

    setAutoColors(autoColors = null, property=null) {
        this._autoColors = autoColors;
        this._autoColorsProperty = property;
    }

    getAutoColors() {
        return this._autoColors;
    }

    getAutoColorProperty() {
        return this._autoColorsProperty;
    }

    async performAction(nodeids_in, ignoreVisibility = true) {

        if (this._action[0] == "" && this._action[1] == "") {
            return;
        }
        let nodeidst;
        if (nodeids_in) {
            nodeidst = nodeids_in;
        }
        else {
            nodeidst = await this.apply();
        }


        for (let currentAction = 0; currentAction < 2; currentAction++) {
            let nodeids = [];
            if (ignoreVisibility || this._action[currentAction] == "Isolate") {
                nodeids = nodeidst;
            }
            else {
                for (let i = 0; i < nodeidst.length; i++) {
                    if (this._viewer.model.getBranchVisibility(nodeidst[i])) {
                        nodeids.push(nodeidst[i]);
                    }
                }
            }

            switch (this._action[currentAction]) {
                case "red":
                    await this._viewer.model.setNodesFaceColor(nodeids, new Communicator.Color(255, 0, 0));
                    break;
                case "green":
                    await this._viewer.model.setNodesFaceColor(nodeids, new Communicator.Color(0, 255, 0));
                    break;
                case "blue":
                    await this._viewer.model.setNodesFaceColor(nodeids, new Communicator.Color(0, 0, 255));
                    break;
                case "yellow":
                    await this._viewer.model.setNodesFaceColor(nodeids, new Communicator.Color(255, 255, 0));
                    break;
                case "grey":
                    await this._viewer.model.setNodesFaceColor(nodeids, new Communicator.Color(128, 128, 128));
                    break;
                case "Transparent":
                    await this._viewer.model.setNodesOpacity(nodeids, 0.25);
                    break;
                case "Opaque":
                    await this._viewer.model.setNodesOpacity(nodeids, 1.0);
                    break;

                case "Isolate":
                    await this._viewer.view.isolateNodes(nodeids, 0, false);
                    break;
                case "Show":
                    await this._viewer.model.setNodesVisibility(nodeids, true);
                    break;
                case "Hide":
                    await this._viewer.model.setNodesVisibility(nodeids, false);
                    break;
                case "Auto Color":
                    await this.autoColorAction(nodeids);
                    break;
                case "Select":
                    let selections = [];
                    for (let i = 0; i < nodeids.length; i++) {
                        selections.push(new Communicator.Selection.SelectionItem(nodeids[i]));
                    }
                    await this._viewer.selectionManager.add(selections);
                    break;
            }
        }
    }

    setKeepSearchingChildren(keepSearchingChildren) {
        this._keepSearchingChildren = keepSearchingChildren;
    }

    getKeepSearchingChildren() {
        return this._keepSearchingChildren;
    }

    updateConditions(conditions) {
        this._conditions = conditions;
    }

    setProp(isProp) {
        this._prop = isProp;
    }

    getProp() {
        return this._prop;
    }

    setName(name) {
        this._name = name;
        if (this._name == "") {
            this._name = this.generateString();
        }
    }

    getName() {
        return this._name;
    }

    getNumConditions() {
        return this._conditions.length;
    }

    getCondition(conditionpos) {
        return this._conditions[conditionpos];
    }

    addCondition(condition) {
        this._conditions.push(condition);
    }

    removeCondition(conditionpos) {
        if (this._conditions.length == 1 && this._conditions[0].childFilter) {
            let cf = this._conditions[0].childFilter;
            this._conditions.splice(0, 1);
            for (let i = 0; i < cf._conditions.length; i++) {
                this._conditions.unshift(cf._conditions[i]);
            }
        }
        else {
            this._conditions.splice(conditionpos, 1);
        }
    }



    fromJSON(json) {
        this._conditions = [];

        for (let i = 0; i < json.conditions.length; i++) {
            let condition = new SmartSearchCondition();
            condition.fromJSON(json.conditions[i]);
            this._conditions.push(condition);
        }
        for (let i = 0; i < this._conditions.length; i++) {
            if (this._conditions[i].childFilter) {
                let newfilter = new SmartSearch(this._manager, this._conditions[i].childFilter.startnode);
                newfilter.fromJSON(this._conditions[i].childFilter);
                this._conditions[i].childFilter = newfilter;
            }
        }

        this._name = json.name;

        if (json.prop == undefined) {
            this._prop = false;
        }
        else {
            this._prop = json.prop;
        }

        if (json.action == undefined) {
            this._action = ["",""];
        }
        else {
            this._action = JSON.parse(JSON.stringify(json.action));
        }


        if (json.keepSearchingChildren == undefined) {
            this._keepSearchingChildren = false;
        }
        else {
            this._keepSearchingChildren = json.keepSearchingChildren;
        }
        if (json.id) {
            this._id = json.id;
        }

        if (json.autoColors) {
            this._autoColorsProperty = json.autoColorsProperty;
            this._autoColors = [];
            for (let i = 0; i < json.autoColors.length; i++) {
                this._autoColors[json.autoColors[i].name] = new Communicator.Color(json.autoColors[i].r, json.autoColors[i].g, json.autoColors[i].b);
            }
        }
    }

    toJSON() {

        let newconditions = [];
        for (let i = 0; i < this._conditions.length; i++) {
            let fjson = this._conditions[i].toJSON(this._manager);

            if (this._conditions[i].childFilter) {
                fjson.childFilter = this._conditions[i].childFilter.toJSON();
            }
            newconditions.push(fjson);
        }

        let autocolors = null;
        if (this._autoColors) {
            autocolors = [];
            for (let key in this._autoColors) {
                let color = this._autoColors[key];
                if (color) {
                    autocolors.push({ name: key, r: color.r, g: color.g, b: color.b });
                }
            }

        }

        return { autoColorsProperty: this._autoColorsProperty, autoColors: autocolors, action: this._action, conditions: newconditions, name: this._name, id: this._id, keepSearchingChildren: this._keepSearchingChildren, prop: this._prop };
    }

    limitToNodes(nodeids) {
        this._limitselectionlist = [];
        this._searchCounter = 0;
        for (let i = 0; i < nodeids.length; i++)
            this._limitselectionlist.push(nodeids[i]);

    }

    getLimitSelectionList() {
        return this._limitselectionlist;
    }

    getStartNode() {
        return this._startnode;
    }

    getSearchCounter() {
        if (this._limitselectionlist.length == 0)
            return this._searchCounter-1;
        else {
            return this._searchCounter;
        }
    }

    async apply() {
        this._selectionBounds = null;
        this._searchCounter = 0;
        //      let t1 = new Date();
        let conditions = this._conditions;
        let limitlist = this._limitselectionlist;

        for (let i = 0; i < conditions.length; i++) {
            conditions[i].text = conditions[i].text.replace(/&quot;/g, '"');

            if (conditions[i].propertyName.slice(-2) == "/*") {
                conditions[i].wildcardString = conditions[i].propertyName.slice(0, -2); 
            }
            else {
                conditions[i].wildcardString = null;
            }
            conditions[i].wildcardArray = null;
        }
       

        let matchingnodes = [];
        if (limitlist.length == 0) {
            if (this._startnode == this._viewer.model.getRootNode())
                await this._gatherMatchingNodesRecursive(conditions, this._startnode, matchingnodes, this._startnode, "");
            else
                await this._gatherMatchingNodesRecursive(conditions, this._startnode, matchingnodes, this._viewer.model.getNodeParent(this._startnode), "");
        }
        else {
            for (let i = 0; i < limitlist.length; i++) {
                await this._gatherMatchingNodesRecursive(conditions, limitlist[i], matchingnodes, this._viewer.model.getNodeParent(limitlist[i]), "");
            }
        }
        //        let t2 = new Date();
        //        console.log("SmartSearch: " + (t2 - t1) + "ms");
        if (this._manager.getFilterBodies()) {
            let filteredNodes = []; 
            let fnhash = [];
            for (let i = 0; i < matchingnodes.length; i++) {
                if (this._viewer.model.getNodeType(matchingnodes[i]) != Communicator.NodeType.BodyInstance) {
                    if (!fnhash[nodeid]) {
                        filteredNodes.push(matchingnodes[i]);
                        fnhash[matchingnodes[i]] = true;
                    }
                }
                else {
                    let nodeid = this._viewer.model.getNodeParent(matchingnodes[i]);
                    if (!fnhash[nodeid]) {
                        filteredNodes.push(nodeid);
                        fnhash[nodeid] = true;
                    }
                }
            }
            return filteredNodes;
        }
        return matchingnodes;
    }

  
    async testOneNodeAgainstConditions(id) {
        let conditions = this._conditions;
        for (let i = 0; i < conditions.length; i++) {
            conditions[i].text = conditions[i].text.replace(/&quot;/g, '"');
        }
        return await this._testNodeAgainstConditions(id, this._conditions, "");
    }

    async findAllPropertiesOnNode(id, conditionsIn, foundConditionsIn, alreadyDoneHashIn) {
        let conditions;
        let foundConditions;
        let alreadyDoneHash;
        if (!conditionsIn) {
            conditions = this._conditions;
            foundConditions = [];
            alreadyDoneHash = [];
        }
        else {
            conditions = conditionsIn;
            foundConditions = foundConditionsIn;
            alreadyDoneHash = alreadyDoneHashIn;
        }

        for (let i = 0; i < conditions.length; i++) {
            if (conditions[i].childFilter) {
                await this.findAllPropertiesOnNode(id, conditions[i].childFilter._conditions, foundConditions, alreadyDoneHash);
            }
            else {
                if (conditions[i].propertyType == SmartSearchPropertyType.property) {
                    let conditionsOnNode = this._manager._propertyHash[id];
                    if (conditionsOnNode[conditions[i].propertyName] && !alreadyDoneHash[conditions[i].propertyName]) {
                        alreadyDoneHash[conditions[i].propertyName] = true;
                        foundConditions.push({ name: conditions[i].propertyName, value: conditionsOnNode[conditions[i].propertyName] });
                    }
                }
            }
        }
        return foundConditions;

    }

    generateString() {
        let text = "";
        for (let i = 0; i < this._conditions.length; i++) {
            if (i > 0) {
                text += " " + (this._conditions[i].and ? "and" : "or") + " ";
            }
            if (this._conditions[i].childFilter) {
                text += "(" + this._conditions[i].childFilter.generateString() + ") ";
            }
            else {
                if (this._conditions[i].relationship) {
                    text += "Rel:" + SmartSearchCondition.convertEnumRelationshipTypeToString(this._conditions[i].relationship) + "(";
                }
                if (this._conditions[i].propertyType == SmartSearchPropertyType.SmartSearch) {
                    text += "("
                }
                text += this._conditions[i].propertyName + " " + SmartSearchCondition.convertEnumConditionToString(this._conditions[i].conditionType) + " " + this._conditions[i].text;
                if (this._conditions[i].propertyType == SmartSearchPropertyType.SmartSearch) {
                    text += ")"
                }
                if (this._conditions[i].relationship) {
                    text += ")";
                }
            }
        }
        text = text.replace(/&quot;/g, '"');
        return text;
    }

    async _checkSpaceBoundaryCondition(id, condition) {
        let bimid = this._viewer.model.getBimIdFromNode(id);

        let elements;
        if (this._manager._spaceBoundaryHash[id]) {
            elements = this._manager._spaceBoundaryHash[id];
        }
        else {
            elements = this._viewer.model.getBimIdRelatingElements(id, bimid, Communicator.RelationshipType.SpaceBoundary);
            this._manager._spaceBoundaryHash[id] = elements;
        }


        if (elements.length > 0) {

            let offset = this._viewer.model.getNodeIdOffset(id);
            let conditions = [];
            conditions.push(condition);
            let savrel = condition.relationship;
            condition.relationship = false;
            for (let i = 0; i < elements.length; i++) {
                if (await this._testNodeAgainstConditions(parseInt(elements[i]) + offset, conditions, "")) {
                    condition.relationship = savrel;
                    return true;
                }
            }
            condition.relationship = savrel;
        }
        else {
            if (condition.conditionType == SmartSearchConditionType.notExists) {
                return true;
            }
        }
        return false;

    }

    async _checkNodeParentCondition(id, condition) {

        let parentid = this._viewer.model.getNodeParent(id);
        let offset = this._viewer.model.getNodeIdOffset(id);
        let conditions = [];
        conditions.push(condition);
        let savrel = condition.relationship;
        condition.relationship = false;
        if (await this._testNodeAgainstConditions(parentid + offset, conditions, "")) {
            condition.relationship = savrel;
            return true;
        }
        condition.relationship = savrel;
        return false;
    }

    async _checkNodeChildrenCondition(id, condition) {

        let elements = this._viewer.model.getNodeChildren(id);
        if (elements.length > 0) {

            let offset = this._viewer.model.getNodeIdOffset(id);
            let conditions = [];
            conditions.push(condition);
            let savrel = condition.relationship;
            condition.relationship = false;
            for (let i = 0; i < elements.length; i++) {
                if (await this._testNodeAgainstConditions(elements[i] + offset, conditions, "")) {
                    condition.relationship = savrel;
                    return true;
                }
            }
            condition.relationship = savrel;
        }
        return false;
    }


    async _checkAggregateCondition(id, condition) {
        let bimid = this._viewer.model.getBimIdFromNode(id);

        let elements;
        if (this._manager._aggregateHash[id]) {
            elements = this._manager._aggregateHash[id];
        }
        else {
            elements = this._viewer.model.getBimIdRelatingElements(id, bimid, Communicator.RelationshipType.Aggregates);
            this._manager._aggregateHash[id] = elements;
        }


        if (elements.length > 0) {

            let offset = this._viewer.model.getNodeIdOffset(id);
            let conditions = [];
            conditions.push(condition);
            let savrel = condition.relationship;
            condition.relationship = false;
            for (let i = 0; i < elements.length; i++) {
                if (await this._testNodeAgainstConditions(parseInt(elements[i]) + offset, conditions, "")) {
                    condition.relationship = savrel;
                    return true;
                }
            }
            condition.relationship = savrel;
        }
        else {
            if (condition.conditionType == SmartSearchConditionType.notExists) {
                return true;
            }
        }
        return false;
    }


    async _checkContainedInCondition(id, condition) {
        let bimid = this._viewer.model.getBimIdFromNode(id);

        let elements;
        if (this._manager._containedInSpatialStructureHash[id]) {
            elements = this._manager._containedInSpatialStructureHash[id];
        }
        else {
            elements = this._viewer.model.getBimIdRelatingElements(id, bimid, Communicator.RelationshipType.ContainedInSpatialStructure);
            this._manager._containedInSpatialStructureHash[id] = elements;
        }

       

        if (elements.length > 0) {

            let offset = this._viewer.model.getNodeIdOffset(id);
            let conditions = [];
            conditions.push(condition);
            let savrel = condition.relationship;
            condition.relationship = false;
            for (let i = 0; i < elements.length; i++) {
                if (await this._testNodeAgainstConditions(parseInt(elements[i]) + offset, conditions, "")) {
                    condition.relationship = savrel;
                    return true;
                }
            }
            condition.relationship = savrel;
        }
        else {
            if (condition.conditionType == SmartSearchConditionType.notExists) {
                return true;
            }
        }
        
        return false;
    }

    _evaluateComparison(expression) {
        const regex = /^\s*(-?\d+(?:\.\d+)?)\s*([<>]=?)\s*(-?\d+(?:\.\d+)?)\s*$/;
        const match = expression.match(regex);

        if (!match) {
            return false;
        }

        const num1 = parseFloat(match[1]);
        const operator = match[2];
        const num2 = parseFloat(match[3]);

        switch (operator) {
            case '<':
                return num1 < num2;
            case '>':
                return num1 > num2;
            case '<=':
                return num1 <= num2;
            case '>=':
                return num1 >= num2;
            default:
                return false;
        }
    }


    _extractCoordinates(input) {
        const regex = /x:([\d,\-]+(\.\d+)?)\s*y:([\d,\-]+(\.\d+)?)\s*z:([\d,\-]+(\.\d+)?)/;
        const match = input.match(regex);

        if (match) {
            const x = parseFloat(match[1].replace(',', ''));
            const y = parseFloat(match[3].replace(',', ''));
            const z = parseFloat(match[5].replace(',', ''));

            return  new Communicator.Point3(x, y, z );
        } 
    }


    async _checkCondition(id, condition, chaintext) {
        if (condition.conditionType != SmartSearchConditionType.contains) {
            if (condition.conditionType == SmartSearchConditionType.exists || condition.conditionType == SmartSearchConditionType.notExists) {
                let res = false;
                let invert = false;
                if (condition.conditionType == SmartSearchConditionType.notExists) {
                    invert = true;
                }
                
                if (condition.propertyType == SmartSearchPropertyType.property) {
                    if (this._manager._propertyHash[id] && this._manager._propertyHash[id][condition.propertyName] != undefined) res = true;
                }
                else if (condition.propertyType == SmartSearchPropertyType.nodeName) { 
                    if (this._viewer.model.getNodeName(id) != "") res = true;
                }
                else if (condition.propertyType == SmartSearchPropertyType.nodeId || condition.propertyType == SmartSearchPropertyType.nodeType) {
                    res = true;
                }
                else if (condition.propertyType == SmartSearchPropertyType.ifcglobalid) {
                    if(this._viewer.model.getGenericIdFromBimId(id, id.toString()) != null) res = true;
                }
                else if (condition.propertyType == SmartSearchPropertyType.nodeColor) {
                    let children = this._viewer.model.getNodeChildren(id);
                    if (children.length == 0) {
                        let color = await this._viewer.model.getNodesEffectiveFaceColor([id]);
                        if (color[0]) res = true;
                    }
                }
                return invert ? !res : res;
            }

            let searchAgainstNumber;
            if (condition.propertyType == SmartSearchPropertyType.nodeName) {
                searchAgainstNumber = parseFloat(this._viewer.model.getNodeName(id));
            }
            else if (condition.propertyType == SmartSearchPropertyType.nodeId) {
                searchAgainstNumber = id;
            }
            else if (condition.propertyType == SmartSearchPropertyType.numChildren) {
                searchAgainstNumber = this._viewer.model.getNodeChildren(id).length;
            }
            else if (condition.conditionType == SmartSearchConditionType.evaluate) {
                let bounds;
                if (condition.propertyName == "COG") {
                    let text = this._manager._propertyHash[id][condition.propertyName];
                    if (!text) {
                        return false;
                    }
                    let p = this._extractCoordinates(text);
                    bounds = new Communicator.Box(p, p);
                }
                else {

                    try {
                        bounds = await this._viewer.model.getNodesBounding([id]);
                    }
                    catch (e) {
                        return false;
                    }

                    if (condition.text.indexOf("bounds:") != -1) {
                        let bounds2 = condition.text.replace("bounds:", "").split(" ");

                        if (bounds.min.x >= parseFloat(bounds2[0]) && bounds.min.y >= parseFloat(bounds2[1]) && bounds.min.z >= parseFloat(bounds2[2]) &&
                            bounds.max.x <= parseFloat(bounds2[3]) && bounds.max.y <= parseFloat(bounds2[4]) && bounds.max.z <= parseFloat(bounds2[5])) {
                            return true;
                        }
                        return false;
                    }
                }

                let xyz = condition.text.split(",");
                let res = 0;
                for (let i = 0; i < xyz.length; i++) {
                    if (xyz[i].indexOf("x") != -1) {
                        let text;
                        if (xyz[i].indexOf(">") != -1) {
                            text = xyz[i].replace("x", bounds.min.x.toString());
                        }
                        else {
                            text = xyz[i].replace("x", bounds.max.x.toString());
                        }
                        if (this._evaluateComparison(text)) {
                            res++;
                        }
                    }
                    else if (xyz[i].indexOf("y") != -1) {
                        let text;
                        if (xyz[i].indexOf(">") != -1) {
                            text = xyz[i].replace("y", bounds.min.y.toString());
                        }
                        else {
                            text = xyz[i].replace("y", bounds.max.y.toString());

                        }
                        if (this._evaluateComparison(text)) {
                            res++;
                        }
                    } else if (xyz[i].indexOf("z") != -1) {
                        let text;
                        if (xyz[i].indexOf(">") != -1) {
                            text = xyz[i].replace("z", bounds.min.z.toString());
                        }
                        else {
                            text = xyz[i].replace("z", bounds.max.z.toString());

                        }
                        if (this._evaluateComparison(text)) {
                            res++;
                        }
                    }
                }
                if (res && res == xyz.length) {
                    return true;
                }
                return false;

            }
            else {
                let temp;
                if (this._manager._propertyHash[id]) {
                    temp = this._manager._propertyHash[id][condition.propertyName];
                }
                if (temp == undefined) {
                    if (condition.conditionType == SmartSearchConditionType.unequal)
                        return true;
                    else
                        return false;
                }
                searchAgainstNumber = parseFloat(temp);
            }

            if (condition.conditionType == SmartSearchConditionType.greaterOrEqualDate || condition.conditionType == SmartSearchConditionType.lessOrEqualDate) {
                let temp;
                if (this._manager._propertyHash[id]) {
                    temp = this._manager._propertyHash[id][condition.propertyName];
                }
                if (temp == undefined) {
                    return false;
                }

                if (temp.indexOf(" ") == -1 && !isNaN(parseInt(temp))) {
                    temp = parseInt(temp);
                }
                let searchAgainstDate = new Date(temp);

                if (isNaN(searchAgainstDate.getDate())) {
                    return false;
                }
                let ctext = condition.text;
                if (ctext.indexOf(" ") == -1 && !isNaN(parseInt(ctext))) {
                    ctext = parseInt(ctext);
                }
                let searchDate = new Date(ctext);
                if (condition.conditionType == SmartSearchConditionType.greaterOrEqualDate) {
                    if (searchAgainstDate >= searchDate)
                        return true;
                }
                else if (condition.conditionType == SmartSearchConditionType.lessOrEqualDate) {
                    if (searchAgainstDate <= searchDate)
                        return true;
                }
                return false;
            }
            else {

                let searchNumber = parseFloat(condition.text);
                if (isNaN(searchNumber) || isNaN(searchAgainstNumber))
                    return false;

                if (condition.conditionType == SmartSearchConditionType.greaterOrEqual) {
                    if (searchAgainstNumber >= searchNumber)
                        return true;
                }
                else if (condition.conditionType == SmartSearchConditionType.lessOrEqual) {
                    if (searchAgainstNumber <= searchNumber)
                        return true;
                }
                else if (condition.conditionType == SmartSearchConditionType.unequal) {
                    if (searchAgainstNumber != searchNumber)
                        return true;
                }
                else {
                    if (searchAgainstNumber == searchNumber)
                        return true;
                }
                return false;
            }
        }
        else {
            let searchTerms = condition.text.split(",");
            let searchAgainst = "";
            if (condition.propertyType == SmartSearchPropertyType.nodeName) {
                searchAgainst = this._viewer.model.getNodeName(id);
            }
            else if (condition.propertyType == SmartSearchPropertyType.relationship) {
                searchAgainst = chaintext;
            }
            else if (condition.propertyType == SmartSearchPropertyType.nodeChain) {
                if (chaintext) {
                    searchAgainst = chaintext;
                }
                else {
                    searchAgainst = SmartSearchResult.createChainText(this._viewer,id, this._viewer.model.getRootNode(), 0);

                }
            }
            else if (condition.propertyType == SmartSearchPropertyType.numChildren) {
                let children = this._viewer.model.getNodeChildren(id);
                for (let i = 0; i < children.length; i++) {
                    searchAgainst += this._viewer.model.getNodeName(children[i]);
                }
            }
            else if (condition.propertyType == SmartSearchPropertyType.nodeType) {
                searchAgainst = Communicator.NodeType[this._viewer.model.getNodeType(id)];
            }
            else if (condition.propertyType == SmartSearchPropertyType.nodeColor) {
                let children = this._viewer.model.getNodeChildren(id);
                if (children.length > 0) {
                    searchAgainst = "x";
                }
                else {
                    let colors = await this._viewer.model.getNodesEffectiveFaceColor([id]);
                    if (colors.length > 0)
                        searchAgainst = colors[0].r + " " + colors[0].g + " " + colors[0].b;
                    else
                        searchAgainst = "x";

                }
            }

            else if (condition.propertyType == SmartSearchPropertyType.nodeId) {
                searchAgainst = id.toString();
            }
            else if (condition.propertyType == SmartSearchPropertyType.ifcglobalid) {
                searchAgainst = this._viewer.model.getGenericIdFromBimId(id, id.toString());
            }
            else {
                if (this._manager._propertyHash[id] == undefined || this._manager._propertyHash[id][condition.propertyName] == undefined) {
                    searchAgainst = undefined;
                }
                else {
                    searchAgainst = this._manager._propertyHash[id][condition.propertyName];
                }
            }

            if (searchAgainst == undefined)
                searchAgainst = "";
            let foundmust = 0;
            let must = 0;
            let mustnot = 0;
            let foundmustnot = 0;
            let other = 0;

            for (let i = 0; i < searchTerms.length; i++) {
                let exactSearch;
                let term;
                if (searchTerms[i][0] == '"' || searchTerms[i][1] == '"') {
                    exactSearch = true;
                    if (searchTerms[i][0] == '"') {
                        term = searchTerms[i].substring(1, searchTerms[i].length - 1);
                    }
                    else {
                        let prefix = searchTerms[i][0];
                        term = searchTerms[i].substring(2, searchTerms[i].length - 1);
                        term = prefix + term;
                    }

                }
                else {
                    term = searchTerms[i];
                    exactSearch = false;
                }

                if (condition.propertyType == SmartSearchPropertyType.nodeId) {
                    exactSearch = true;
                }

                if (term == "" || (term.length == 1 && (term[0] == "+" || term[0] == "-")))
                    return;
                if (term[0] == "+") {
                    must++;
                    if (exactSearch) {
                        if (searchAgainst.toLowerCase() == term.substring(1).toLowerCase())
                            foundmust++;
                    }
                    else {
                        if (searchAgainst.toLowerCase().indexOf(term.substring(1).toLowerCase()) != -1)
                            foundmust++;
                    }
                }
                else if (term[0] == "-") {
                    mustnot++;
                    if (exactSearch) {
                        if (searchAgainst.toLowerCase() != term.substring(1).toLowerCase())
                            foundmustnot++;
                    }
                    else {
                        if (searchAgainst.toLowerCase().indexOf(term.substring(1).toLowerCase()) == -1)
                            foundmustnot++;
                    }
                }
                else {
                    if (exactSearch) {
                        if (searchAgainst.toLowerCase() == term.toLowerCase())
                            other++;
                    }
                    else {
                        if (searchAgainst.toLowerCase().indexOf(term.toLowerCase()) != -1)
                            other++;
                    }
                }

            }

            if (must == foundmust && mustnot == foundmustnot && (other > 0 || (foundmust + foundmustnot) == searchTerms.length))
                return true;
            else
                return false;
        }
    }

    async _testNodeAgainstConditions(id, conditions, chaintext) {

        let foundtotal = 0;
        let isor = false;
        if (conditions.length > 1 && !conditions[1].and)
            isor = true;

        for (let i = 0; i < conditions.length; i++) {

            let res;
            if (conditions[i].relationship) {
                if (conditions[i].relationship == SmartSearchRelationshipType.spaceBoundary) {
                    res = await this._checkSpaceBoundaryCondition(id, conditions[i]);
                }
                else if (conditions[i].relationship == SmartSearchRelationshipType.containedIn) {
                    res = await this._checkContainedInCondition(id, conditions[i]);
                }
                else if (conditions[i].relationship == SmartSearchRelationshipType.aggregate) {
                    res = await this._checkAggregateCondition(id, conditions[i]);
                }
                else if (conditions[i].relationship == SmartSearchRelationshipType.nodeParent) {
                    res = await this._checkNodeParentCondition(id, conditions[i]);
                }
                else if (conditions[i].relationship == SmartSearchRelationshipType.nodeChildren) {
                    res = await this._checkNodeChildrenCondition(id, conditions[i]);
                }
            }
            else if (conditions[i].propertyType == SmartSearchPropertyType.SmartSearch) {

                if (!conditions[i].SmartSearch) {
                    if (!conditions[i].SmartSearchID) {
                        let f = this._manager.getSmartSearchByName(conditions[i].text);
                        conditions[i].SmartSearchID = f._id;
                        conditions[i].SmartSearch = f;
                    }
                    else {
                        conditions[i].SmartSearch = this._manager.getSmartSearchByID(conditions[i].SmartSearchID);
                    }
                }
                res = await this._testNodeAgainstConditions(id, conditions[i].SmartSearch._conditions, chaintext);
                if (conditions[i].conditionType == SmartSearchConditionType.unequal) {
                    res = !res;
                }
            }
            else if (conditions[i].wildcardString) {
                if (!conditions[i].wildcardArray) {
                    conditions[i].wildcardArray = [];
                    for (let j in this._manager._allPropertiesHash) {

                        if (j.indexOf(conditions[i].wildcardString) != -1 && j.indexOf("/*") == -1) {
                            conditions[i].wildcardArray.push(j);
                        }
                    }
                }
                let condition = new SmartSearchCondition();

                condition.propertyType = conditions[i].type;
                condition.text = conditions[i].text;
                condition.conditionType = conditions[i].conditionType;

                let numfound = 0;
                for (let j = 0; j < conditions[i].wildcardArray.length; j++) {
                    condition.propertyName = conditions[i].wildcardArray[j];
                    res = await this._checkCondition(id, condition, chaintext);
                    if (res == true) {
                        if (condition.conditionType == SmartSearchConditionType.contains || condition.conditionType == SmartSearchConditionType.exists) {
                            break;
                        }
                        numfound++;
                    }
                }

                if (condition.conditionType == SmartSearchConditionType.notExists) {
                    if (numfound == conditions[i].wildcardArray.length) {
                        res = true;
                    }
                    else {
                        res = false;
                    }
                }
            }
            else {
                if (conditions[i].childFilter) {
                    res = await this._testNodeAgainstConditions(id, conditions[i].childFilter._conditions, chaintext);
                }
                else {
                    res = await this._checkCondition(id, conditions[i], chaintext);
                }
            }
            if (res == false) {
                if (!isor) {
                    break;
                }
            }
            else {
                foundtotal++;
            }
        }

        if ((!isor && foundtotal == conditions.length) || (isor && foundtotal > 0)) {
            return true;
        }
        return false;
    }

    async _gatherMatchingNodesRecursive(conditions, id, matchingnodes, startid, chaintext) {
        this._searchCounter++;
        if (this._searchCounter % 1500 == 0) {
            await new Promise(r => setTimeout(r, 1));
        }
        if (this._manager.getSearchVisible() && !this._viewer.model.getBranchVisibility(id)) {
            return;
        }
        let nl = this._viewer.model.getNodeName(id) + ">";
        if (id != startid) {
            if (await this._testNodeAgainstConditions(id, conditions, chaintext)) {
                matchingnodes.push(id);
                if (this._manager.getKeepSearchingChildren() != undefined ? !this._manager.getKeepSearchingChildren() : !this._keepSearchingChildren) {
                    return;
                }
            }
        }
        let children = this._viewer.model.getNodeChildren(id);
        for (let i = 0; i < children.length; i++) {
            await this._gatherMatchingNodesRecursive(conditions, children[i], matchingnodes, startid, chaintext + nl);

        }
    }

    _generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async autoColorAction(searchresults) {
        if (this._autoColors) {
            let categoryHash = [];
            let selectedProperty = this._autoColorsProperty;

            if (selectedProperty) {
                if (selectedProperty == "Node Name") {
                    for (let j = 0; j < searchresults.length; j++) {
                        let name = this._viewer.model.getNodeName(searchresults[j]);
                        if (categoryHash[name] == undefined) {
                            categoryHash[name] = { ids: [] };
                        }
                        categoryHash[name].ids.push(searchresults[j]);
                    }
                }
                else {
                    let propname = selectedProperty;
                    for (let j = 0; j < searchresults.length; j++) {
                        let id = searchresults[j];
                        if (this._manager._propertyHash[id][propname] != undefined) {
                            if (categoryHash[this._manager._propertyHash[id][propname]] == undefined) {
                                categoryHash[this._manager._propertyHash[id][propname]] = { ids: [] };
                            }
                            categoryHash[this._manager._propertyHash[id][propname]].ids.push(searchresults[j]);
                        }
                    }
                }
            }

            for (let i in categoryHash) {
                if (this._autoColors[i]) {
                    await this._viewer.model.setNodesFaceColor(categoryHash[i].ids, this._autoColors[i]);
                }
            }

        }
    }
}
