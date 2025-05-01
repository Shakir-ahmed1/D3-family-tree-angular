import { Renderer2, ElementRef } from '@angular/core';
import { FamilyTreeDrawer } from "../FamilyTreeDrawer";
import { SuggestEdits, SuggestableActions, FamilyNode } from "../interfaces/node.interface";
import { DataManager } from "../services/data-manager";
import { nodeManagmentService } from "../services/node-managment-service";
import { suggestionService } from "../services/suggestion-service";
import { createUserProfileElement } from "../utils/utils";
import { HtmlElementsManager } from "./htmlElementsManager";

export class SuggestionManager {
    private htmlElementsManager: HtmlElementsManager;
    private nodeManager: DataManager;
    private familyTreeId: number;
    private treeDrawer: FamilyTreeDrawer;
    private renderer: Renderer2;
    private elementRef: ElementRef;

    constructor(
        htmlElementsManager: HtmlElementsManager,
        nodeManager: DataManager,
        familyTreeId: number,
        treeDrawer: FamilyTreeDrawer,
        renderer: Renderer2,
        elementRef: ElementRef
    ) {
        this.htmlElementsManager = htmlElementsManager;
        this.nodeManager = nodeManager;
        this.familyTreeId = familyTreeId;
        this.treeDrawer = treeDrawer;
        this.renderer = renderer;
        this.elementRef = elementRef;
    }

    reviewUpdateSuggestionBody(suggestionObject: SuggestEdits, rootNodeId: number) {
        const rootNodeData = this.nodeManager.getNode(rootNodeId);
        const suggestionContainer = this.renderer.createElement('div');
        this.renderer.setStyle(suggestionContainer, 'border', '1px black solid');
        this.renderer.setStyle(suggestionContainer, 'marginBottom', '5px');

        const suggestingMember = createUserProfileElement(suggestionObject.suggestedBy, this.renderer);
        this.renderer.appendChild(suggestionContainer, suggestingMember as HTMLDivElement);
        const field = this.renderer.createElement('p');
        this.renderer.setProperty(field, 'innerHTML', `<strong>Reason:</strong> ${suggestionObject.reason || 'N/A'}`);
        this.renderer.addClass(field, 'dynamic-input');
        this.renderer.appendChild(suggestionContainer, field);

        ['name', 'title', 'phone', 'address', 'nickName', 'birthDate', 'deathDate'].forEach((key) => {
            const nodeKey = key as keyof typeof suggestionObject.suggestedNode1;
            const rootNodeKey = key as keyof typeof rootNodeData;

            if (suggestionObject.suggestedNode1[nodeKey]) {
                const field = this.renderer.createElement('p');
                const existingValue = `<span class="old-data">${rootNodeData[rootNodeKey] || ''}</span>`;
                this.renderer.setProperty(field, 'innerHTML', `<strong>${key}:</strong>${rootNodeData[rootNodeKey] ? existingValue : ''}<span class="new-data">${suggestionObject.suggestedNode1[nodeKey] || 'N/A'}</span>`);
                this.renderer.addClass(field, 'dynamic-input');
                this.renderer.appendChild(suggestionContainer, field);
            }
        });

        if (this.nodeManager.canUpdate(rootNodeId)) {
            const acceptButton = this.renderer.createElement('button');
            this.renderer.setProperty(acceptButton, 'textContent', 'Accept');
            this.renderer.addClass(acceptButton, 'buttonPrimary');
            // @ts-ignore
            this.renderer.listen(acceptButton, 'click', async (e) => {
                e.preventDefault();
                await suggestionService.acceptOrRejectSuggestion(this.familyTreeId, suggestionObject.id, 'accepted');
                await this.htmlElementsManager.refreshAfterSuggestion(rootNodeId);
            });
            this.renderer.appendChild(suggestionContainer, acceptButton);

            const rejectButton = this.renderer.createElement('button');
            this.renderer.setProperty(rejectButton, 'textContent', 'Reject');
            this.renderer.addClass(rejectButton, 'buttonSecondary');
            //@ts-ignore
            this.renderer.listen(rejectButton, 'click', async (e) => {
                e.preventDefault();
                await suggestionService.acceptOrRejectSuggestion(this.familyTreeId, suggestionObject.id, 'rejected');
                await this.htmlElementsManager.refreshAfterSuggestion(rootNodeId);
            });
            this.renderer.appendChild(suggestionContainer, rejectButton);
        }

        const isSuggestor = suggestionObject.suggestedBy.id === this.nodeManager.data.myInfo?.id;
        if (isSuggestor) {
            const cancelButton = this.renderer.createElement('button');
            this.renderer.setProperty(cancelButton, 'textContent', 'Cancel');
            this.renderer.addClass(cancelButton, 'buttonPrimary');
            // @ts-ignore
            this.renderer.listen(cancelButton, 'click', async (e) => {
                e.preventDefault();
                await suggestionService.cancelSuggestion(this.familyTreeId, suggestionObject.id);
                await this.htmlElementsManager.refreshAfterSuggestion(rootNodeId);
            });
            this.renderer.appendChild(suggestionContainer, cancelButton);
        }

        return suggestionContainer;
    }

    reviewDeletionSuggestionBody(suggestionObject: SuggestEdits, rootNodeId: number) {
        const rootNodeData = this.nodeManager.getNode(rootNodeId);
        const suggestionContainer = this.renderer.createElement('div');
        this.renderer.setStyle(suggestionContainer, 'border', '1px black solid');
        this.renderer.setStyle(suggestionContainer, 'marginBottom', '5px');

        const suggestingMember = createUserProfileElement(suggestionObject.suggestedBy, this.renderer);
        this.renderer.appendChild(suggestionContainer, suggestingMember as HTMLDivElement);
        const field = this.renderer.createElement('p');
        this.renderer.setProperty(field, 'innerHTML', `<strong>Reason:</strong> ${suggestionObject.reason || 'N/A'}`);
        this.renderer.addClass(field, 'dynamic-input');
        this.renderer.appendChild(suggestionContainer, field);

        const message = this.renderer.createElement('p');
        this.renderer.setProperty(message, 'innerHTML', `Delete <strong style="color: red;">${rootNodeData.name}?</strong>`);
        this.renderer.addClass(message, 'dynamic-input');
        this.renderer.appendChild(suggestionContainer, message);

        if (this.nodeManager.canCreate(rootNodeId)) {
            const acceptButton = this.renderer.createElement('button');
            this.renderer.setProperty(acceptButton, 'textContent', 'Accept');
            this.renderer.addClass(acceptButton, 'buttonPrimary');
            // @ts-ignore
            this.renderer.listen(acceptButton, 'click', async (e) => {
                e.preventDefault();
                await suggestionService.acceptOrRejectSuggestion(this.familyTreeId, suggestionObject.id, 'accepted');
                const previousNodeId = this.treeDrawer.popRootHistory(rootNodeId);
                const nodesArray = await nodeManagmentService.fetchNodesArrays(this.familyTreeId);
                if (nodesArray) {
                    this.treeDrawer.fetchData(nodesArray, previousNodeId as number, true);
                    this.treeDrawer.toggleModes(previousNodeId, 'view');
                }
                this.htmlElementsManager.displaySuggestionUpdateEdits(rootNodeId);
                this.treeDrawer.updateNodesNameText();
            });
            this.renderer.appendChild(suggestionContainer, acceptButton);

            const rejectButton = this.renderer.createElement('button');
            this.renderer.setProperty(rejectButton, 'textContent', 'Reject');
            this.renderer.addClass(rejectButton, 'buttonSecondary');
            //@ts-ignore
            this.renderer.listen(rejectButton, 'click', async (e) => {
                e.preventDefault();
                await suggestionService.acceptOrRejectSuggestion(this.familyTreeId, suggestionObject.id, 'rejected');
                await this.htmlElementsManager.refreshAfterSuggestion(rootNodeId);
            });
            this.renderer.appendChild(suggestionContainer, rejectButton);
        }

        const isSuggestor = suggestionObject.suggestedBy.id === this.nodeManager.data.myInfo?.id;
        if (isSuggestor) {
            const cancelButton = this.renderer.createElement('button');
            this.renderer.setProperty(cancelButton, 'textContent', 'Cancel');
            this.renderer.addClass(cancelButton, 'buttonPrimary');
            // @ts-ignore
            this.renderer.listen(cancelButton, 'click', async (e) => {
                e.preventDefault();
                await suggestionService.cancelSuggestion(this.familyTreeId, suggestionObject.id);
                await this.htmlElementsManager.refreshAfterSuggestion(rootNodeId);
            });
            this.renderer.appendChild(suggestionContainer, cancelButton);
        }

        return suggestionContainer;
    }

    displaySuggestionUpdateEdits(familyNodeId: number) {
        const pendingSuggestionsDisplayer = this.elementRef.nativeElement.querySelector('#pendingUpdateSuggestions');
        if (pendingSuggestionsDisplayer) {
            this.renderer.setProperty(pendingSuggestionsDisplayer, 'innerHTML', '');
        }

        const nodesSuggestions = this.nodeManager.getNodeSuggestions(familyNodeId).filter(
            item => item.suggestedAction === SuggestableActions.UpdateNode || item.suggestedAction === SuggestableActions.DeleteNode
        );

        if (nodesSuggestions.length === 0) {
            const message = this.renderer.createElement('p');
            this.renderer.setProperty(message, 'textContent', 'No pending suggestions');
            this.renderer.setStyle(message, 'textAlign', 'center');
            if (pendingSuggestionsDisplayer) {
                this.renderer.appendChild(pendingSuggestionsDisplayer, message);
            }
        } else {
            nodesSuggestions.forEach(item => {
                if (item.suggestedAction === SuggestableActions.UpdateNode) {
                    const suggestionBody = this.reviewUpdateSuggestionBody(item, familyNodeId);
                    if (pendingSuggestionsDisplayer) {
                        this.renderer.appendChild(pendingSuggestionsDisplayer, suggestionBody);
                    }
                } else if (item.suggestedAction === SuggestableActions.DeleteNode) {
                    const suggestionBody = this.reviewDeletionSuggestionBody(item, familyNodeId);
                    if (pendingSuggestionsDisplayer) {
                        this.renderer.appendChild(pendingSuggestionsDisplayer, suggestionBody);
                    }
                }
            });
        }
    }

    displaySuggestionInfo(suggestionBody: SuggestEdits, rootNodeId: number) {
        const dynamicFields = this.elementRef.nativeElement.querySelector('#dynamicFields');
        let nodeData: FamilyNode;
        if (["ChildOfOneParent", "ChildOfTwoParents"].includes(suggestionBody.suggestedAction)) {
            nodeData = suggestionBody.suggestedNode2!;
        } else {
            nodeData = suggestionBody.suggestedNode1!;
        }

        if (dynamicFields) {
            this.renderer.setProperty(dynamicFields, 'innerHTML', '');
        }

        const reason = this.renderer.createElement('p');
        this.renderer.setProperty(reason, 'innerHTML', `<strong>Reason:</strong> ${suggestionBody.reason || 'N/A'}`);
        this.renderer.addClass(reason, 'dynamic-input');
        if (dynamicFields) {
            this.renderer.appendChild(dynamicFields, reason);
        }

        ['name', 'gender', 'title', 'phone', 'address', 'nickName', 'birthDate', 'deathDate'].forEach((key) => {
            const field = this.renderer.createElement('p');
            this.renderer.setProperty(field, 'innerHTML', `<strong>${key}:</strong> ${nodeData[key as keyof FamilyNode] || 'N/A'}`);
            this.renderer.addClass(field, 'dynamic-input');
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, field);
            }
        });

        if (suggestionBody.suggestedBy) {
            const suggetorContainer = this.renderer.createElement('div');
            this.renderer.setStyle(suggetorContainer, 'border', '1px black solid');
            const field = this.renderer.createElement('p');
            this.renderer.setProperty(field, 'innerHTML', `<strong>Suggested By:</strong>`);
            this.renderer.addClass(field, 'dynamic-input');
            const suggestor = createUserProfileElement(suggestionBody.suggestedBy, this.renderer);
            this.renderer.appendChild(suggetorContainer, field);
            this.renderer.appendChild(suggetorContainer, suggestor as Node);
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, suggetorContainer);
            }
        }

        if (this.nodeManager.canCreate(rootNodeId)) {
            const acceptButton = this.renderer.createElement('button');
            this.renderer.setProperty(acceptButton, 'textContent', 'Accept');
            this.renderer.addClass(acceptButton, 'dynamic-input');
            // @ts-ignore
            this.renderer.listen(acceptButton, 'click', async (e) => {
                e.preventDefault();
                await suggestionService.acceptOrRejectSuggestion(this.familyTreeId, suggestionBody.id, 'accepted');
                const nodesArray = await nodeManagmentService.fetchNodesArrays(this.familyTreeId);
                if (nodesArray) {
                    this.treeDrawer.fetchData(nodesArray, rootNodeId, true);
                }
                const rootNode = this.nodeManager.getNode(rootNodeId);
                this.htmlElementsManager.createViewMode(rootNode, this.nodeManager.memberPriviledge(this.familyTreeId, rootNodeId));
            });
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, acceptButton);
            }

            const rejectButton = this.renderer.createElement('button');
            this.renderer.setProperty(rejectButton, 'textContent', 'Reject');
            this.renderer.addClass(rejectButton, 'dynamic-input');
            // @ts-ignore
            this.renderer.listen(rejectButton, 'click', async (e) => {
                e.preventDefault();
                await suggestionService.acceptOrRejectSuggestion(this.familyTreeId, suggestionBody.id, 'rejected');
                const nodesArray = await nodeManagmentService.fetchNodesArrays(this.familyTreeId);
                if (nodesArray) {
                    this.treeDrawer.fetchData(nodesArray, rootNodeId, true);
                }
                const rootNode = this.nodeManager.getNode(rootNodeId);
                this.htmlElementsManager.createViewMode(rootNode, this.nodeManager.memberPriviledge(this.familyTreeId, rootNodeId));
            });
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, rejectButton);
            }
        }
    }
}