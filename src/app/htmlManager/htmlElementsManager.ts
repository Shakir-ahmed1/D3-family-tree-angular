import { DrawableNode, FamilyNode, genericActionTypes, MemberPriviledge, SuggestEdits } from "../interfaces/node.interface";
import { nodeManagmentService } from "../services/node-managment-service";
import { FamilyTreeDrawer } from "../FamilyTreeDrawer";
import { DataManager } from "../services/data-manager";
import { TabManager } from "./TabManager";
import { SuggestionManager } from "./SuggestionManager";
import { ActionFormManager } from "./ActionFormManager";
import { NodeModeManager } from "./NodeModeManager";
import { ElementRef, Renderer2 } from "@angular/core";

export class HtmlElementsManager {
    private treeDrawer: FamilyTreeDrawer;
    private familyTreeId: number;
    private rootNodeId: number;
    public nodeManager: DataManager;
    private tabManager: TabManager;
    private suggestionManager: SuggestionManager;
    private actionFormManager: ActionFormManager;
    private nodeModeManager: NodeModeManager;
    private renderer: Renderer2;
    private elementRef: ElementRef;

    constructor(
        nodeManager: DataManager,
        familyTreeId: number,
        rootNodeId: number,
        drawer: FamilyTreeDrawer,
        renderer: Renderer2,
        elementRef: ElementRef
    ) {
        this.treeDrawer = drawer;
        this.rootNodeId = rootNodeId;
        this.familyTreeId = familyTreeId;
        this.nodeManager = nodeManager;
        this.renderer = renderer;
        this.elementRef = elementRef;

        this.tabManager = new TabManager(this, nodeManager, familyTreeId, this.renderer, this.elementRef);
        this.suggestionManager = new SuggestionManager(this, nodeManager, familyTreeId, drawer, this.renderer, this.elementRef);
        this.actionFormManager = new ActionFormManager(this, nodeManager, familyTreeId, drawer, this.renderer, this.elementRef);
        this.nodeModeManager = new NodeModeManager(this, nodeManager, familyTreeId, drawer, this.renderer, this.elementRef);

        const modeButton = this.elementRef.nativeElement.querySelector('#modeType');
        if (modeButton) {
            this.renderer.listen(modeButton, 'click', () => {
                this.treeDrawer.toggleModes();
            });
        }
    }

    setRootNodeId(nodeId: number) {
        this.rootNodeId = nodeId;
    }

    setModeType(text: string) {
        const modeButton = this.elementRef.nativeElement.querySelector('#modeType');
        if (modeButton) {
            this.renderer.setProperty(modeButton, 'textContent', text);
        }
    }

    showTab(tab: string) {
        const allTabElements = this.elementRef.nativeElement.querySelectorAll('.tab');
        allTabElements.forEach((tabEl: { id: string; }) => {
            const id = tabEl.id.replace('Tab', '');
            const content = this.elementRef.nativeElement.querySelector(`#${id}Content`);
            if (content) {
                this.renderer.addClass(content, 'hidden');
            }
            this.renderer.removeClass(tabEl, 'active');
        });

        const selectedContent = this.elementRef.nativeElement.querySelector(`#${tab}Content`);
        const selectedTab = this.elementRef.nativeElement.querySelector(`#${tab}Tab`);
        if (selectedContent) {
            this.renderer.removeClass(selectedContent, 'hidden');
        }
        if (selectedTab) {
            this.renderer.addClass(selectedTab, 'active');
        }

        if (tab === 'editSuggestions') {
            this.displaySuggestionUpdateEdits(this.rootNodeId);
        }
    }

    async refreshAfterSuggestion(rootNodeId: number) {
        const nodesArray = await nodeManagmentService.fetchNodesArrays(this.familyTreeId);
        if (nodesArray) {
            this.treeDrawer.fetchData(nodesArray, rootNodeId, true);
        }
        this.displaySuggestionUpdateEdits(rootNodeId);
        this.treeDrawer.updateNodesNameText();
    }

    displaySuggestionUpdateEdits(familyNodeId: number) {
        this.suggestionManager.displaySuggestionUpdateEdits(familyNodeId);
    }

    displaySuggestionInfo(suggestionBody: SuggestEdits, rootNodeId: number) {
        this.suggestionManager.displaySuggestionInfo(suggestionBody, rootNodeId);
    }

    setActionTypeLabel(actionType: genericActionTypes, node: d3.HierarchyNode<DrawableNode>, currentNodeId: number) {
        this.actionFormManager.setActionTypeLabel(actionType, node, currentNodeId);
    }

    createViewMode(data: FamilyNode, memberPriviledge: MemberPriviledge) {
        this.nodeModeManager.createViewMode(data, memberPriviledge);
    }

    createEditMode(nodeData: FamilyNode, memberPriviledge: MemberPriviledge) {
        this.nodeModeManager.createEditMode(nodeData, memberPriviledge);
    }

    deleteMode(nodeData: FamilyNode, memberPriviledge: MemberPriviledge) {
        this.nodeModeManager.deleteMode(nodeData, memberPriviledge);
    }

    suggestDeleteMode(nodeData: FamilyNode, memberPriviledge: MemberPriviledge) {
        this.nodeModeManager.suggestDeleteMode(nodeData, memberPriviledge);
    }

    createSuggestionMode(nodeData: FamilyNode, memberPriviledge: MemberPriviledge) {
        this.nodeModeManager.createSuggestionMode(nodeData, memberPriviledge);
    }

    infoDisplayer(nodeData: FamilyNode, rootNodeId: number) {
        this.setRootNodeId(rootNodeId);
        this.createViewMode(nodeData, this.nodeManager.memberPriviledge(this.familyTreeId, rootNodeId));
    }

    displayNodeDetails() {
        this.showTab('details');
        this.setModeType('view');
        return 'view';
    }
}