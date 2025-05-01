import { Renderer2, ElementRef } from '@angular/core';
import { FamilyTreeDrawer } from "../FamilyTreeDrawer";
import { FamilyNode, MemberPriviledge, Contributor, genericActionTypes, formDataEntries } from "../interfaces/node.interface";
import { DataManager } from "../services/data-manager";
import { nodeManagmentService } from "../services/node-managment-service";
import { suggestionCreationService } from "../services/suggestion-creation-service";
import { otherNodeDetails, contributorsElementGenerator } from "../utils/utils";
import { HtmlElementsManager } from "./htmlElementsManager";

export class NodeModeManager {
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

    createViewMode(data: FamilyNode, memberPriviledge: MemberPriviledge) {
        const dynamicFields = this.elementRef.nativeElement.querySelector('#dynamicFields');
        if (dynamicFields) {
            this.renderer.setProperty(dynamicFields, 'innerHTML', '');
        }

        ['name', 'gender', 'title', 'phone', 'address', 'nickName', 'birthDate', 'deathDate'].forEach((key) => {
            const field = this.renderer.createElement('p');
            this.renderer.setProperty(field, 'innerHTML', `<strong>${key}:</strong> ${data[key as keyof FamilyNode] || 'N/A'}`);
            this.renderer.addClass(field, 'dynamic-input');
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, field);
            }
        });

        if (memberPriviledge === 'create' || memberPriviledge === 'update') {
            const editButton = this.renderer.createElement('button');
            this.renderer.setProperty(editButton, 'textContent', 'Edit');
            this.renderer.addClass(editButton, 'dynamic-input');
            this.renderer.listen(editButton, 'click', () => {
                this.treeDrawer.toggleModes(data.id, 'edit');
                this.htmlElementsManager.createEditMode(data, memberPriviledge);
            });
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, editButton);
            }

            const details = otherNodeDetails(this.nodeManager.getNode(data.id), this.renderer);
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, details);
            }
            const contributors = contributorsElementGenerator(this.nodeManager.data.contributors.find(item => item.id === data.id) as Contributor, this.renderer);
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, contributors);
            }

            const deleteAllowed = this.nodeManager.isAllowedAction(data.id, genericActionTypes.DeleteNode);
            const canSuggest = this.nodeManager.canContribute();
            const canUpdate = this.nodeManager.canUpdate(data.id);

            if (deleteAllowed && canSuggest) {
                const deleteButton = this.renderer.createElement('button');
                this.renderer.setProperty(deleteButton, 'textContent', canUpdate ? 'Delete' : 'Suggest Deletion');
                this.renderer.addClass(deleteButton, 'delete-button');
                this.renderer.listen(deleteButton, 'click', () => {
                    this.treeDrawer.toggleModes(data.id, 'edit');
                    if (canUpdate) {
                        this.htmlElementsManager.deleteMode(data, memberPriviledge);
                    } else {
                        this.htmlElementsManager.suggestDeleteMode(data, memberPriviledge);
                    }
                });
                if (dynamicFields) {
                    this.renderer.appendChild(dynamicFields, deleteButton);
                }
            }
        } else if (memberPriviledge === 'suggest' || memberPriviledge === 'only-create') {
            const editButton = this.renderer.createElement('button');
            this.renderer.setProperty(editButton, 'textContent', 'Suggest Edit');
            this.renderer.addClass(editButton, 'dynamic-input');
            this.renderer.listen(editButton, 'click', () => {
                this.htmlElementsManager.createSuggestionMode(data, memberPriviledge);
            });
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, editButton);
            }

            const deleteAllowed = this.nodeManager.isAllowedAction(data.id, genericActionTypes.DeleteNode);
            if (deleteAllowed) {
                const deleteButton = this.renderer.createElement('button');
                this.renderer.setProperty(deleteButton, 'textContent', 'Suggest Deletion');
                this.renderer.addClass(deleteButton, 'delete-button');
                this.renderer.listen(deleteButton, 'click', () => {
                    this.treeDrawer.toggleModes(data.id, 'edit');
                    this.htmlElementsManager.suggestDeleteMode(data, memberPriviledge);
                });
                if (dynamicFields) {
                    this.renderer.appendChild(dynamicFields, deleteButton);
                }
            }

            const details = otherNodeDetails(this.nodeManager.getNode(data.id), this.renderer);
            const contributors = contributorsElementGenerator(this.nodeManager.data.contributors.find(item => item.id === data.id) as Contributor, this.renderer);
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, contributors);
                this.renderer.appendChild(dynamicFields, details);
            }
        }
    }

    createEditMode(nodeData: FamilyNode, memberPriviledge: MemberPriviledge) {
        const dynamicFields = this.elementRef.nativeElement.querySelector('#dynamicFields');
        if (dynamicFields) {
            this.renderer.setProperty(dynamicFields, 'innerHTML', '');
        }

        const formData: { [key: string]: HTMLInputElement } = {};
        ['name', 'gender', 'title', 'phone', 'address', 'nickName', 'birthDate', 'deathDate'].forEach((key) => {
            const input = this.renderer.createElement('input');
            this.renderer.setAttribute(input, 'type', key.includes('Date') ? 'date' : key.includes('Id') ? 'number' : 'text');
            this.renderer.setAttribute(input, 'name', key);
            this.renderer.setAttribute(input, 'placeholder', key);
            this.renderer.setProperty(input, 'value', nodeData[key as keyof FamilyNode] as string || '');
            this.renderer.addClass(input, 'dynamic-input');
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, input);
            }
            formData[key] = input;
        });

        const saveButton = this.renderer.createElement('button');
        this.renderer.setProperty(saveButton, 'textContent', 'Save');
        this.renderer.addClass(saveButton, 'dynamic-input');
        // @ts-ignore
        this.renderer.listen(saveButton, 'click', async (e) => {
            e.preventDefault();
            const updatedData: { [key: string]: string } = {};
            Object.keys(formData).forEach(key => {
                if (formData[key]?.value && formData[key].value !== nodeData[key as keyof FamilyNode]) {
                    updatedData[key] = formData[key].value;
                }
            });
            await nodeManagmentService.updateNode(this.familyTreeId, nodeData.id, updatedData);
            const nodesArray = await nodeManagmentService.fetchNodesArrays(this.familyTreeId);
            if (nodesArray) {
                this.treeDrawer.fetchData(nodesArray, nodeData.id, true);
            }
            const updatedNode = this.nodeManager.getNode(nodeData.id);
            this.htmlElementsManager.createViewMode(updatedNode, memberPriviledge);
        });

        const cancelButton = this.renderer.createElement('button');
        this.renderer.setProperty(cancelButton, 'textContent', 'Cancel');
        this.renderer.addClass(cancelButton, 'dynamic-input');
        this.renderer.listen(cancelButton, 'click', () => {
            this.htmlElementsManager.createViewMode(nodeData, memberPriviledge);
        });

        if (dynamicFields) {
            this.renderer.appendChild(dynamicFields, saveButton);
            this.renderer.appendChild(dynamicFields, cancelButton);
        }
    }

    deleteMode(nodeData: FamilyNode, memberPriviledge: MemberPriviledge) {
        const dynamicFields = this.elementRef.nativeElement.querySelector('#dynamicFields');
        if (dynamicFields) {
            this.renderer.setProperty(dynamicFields, 'innerHTML', '');
        }

        const deleteMessage = this.renderer.createElement('p');
        this.renderer.setProperty(deleteMessage, 'innerHTML', `Are you sure you want to delete <b>${nodeData.name}</b>?`);
        this.renderer.addClass(deleteMessage, 'delete-message');

        const deleteButtonYes = this.renderer.createElement('button');
        this.renderer.setProperty(deleteButtonYes, 'textContent', 'Yes');
        this.renderer.addClass(deleteButtonYes, 'delete-button');
        // @ts-ignore
        this.renderer.listen(deleteButtonYes, 'click', async (e) => {
            e.preventDefault();
            await nodeManagmentService.deleteNode(this.familyTreeId, nodeData.id);
            const previousNodeId = this.treeDrawer.popRootHistory(nodeData.id);
            const nodesArray = await nodeManagmentService.fetchNodesArrays(this.familyTreeId);
            if (nodesArray) {
                this.treeDrawer.fetchData(nodesArray, previousNodeId as number, true);
            }
        });

        const deleteButtonNo = this.renderer.createElement('button');
        this.renderer.setProperty(deleteButtonNo, 'textContent', 'No');
        this.renderer.addClass(deleteButtonNo, 'dynamic-input');
        this.renderer.listen(deleteButtonNo, 'click', () => {
            this.htmlElementsManager.createViewMode(nodeData, memberPriviledge);
        });

        if (dynamicFields) {
            this.renderer.appendChild(dynamicFields, deleteMessage);
            this.renderer.appendChild(dynamicFields, deleteButtonYes);
            this.renderer.appendChild(dynamicFields, deleteButtonNo);
        }
    }

    suggestDeleteMode(nodeData: FamilyNode, memberPriviledge: MemberPriviledge) {
        const dynamicFields = this.elementRef.nativeElement.querySelector('#dynamicFields');
        const familyTreeForm = this.elementRef.nativeElement.querySelector('#familyTreeForm');
        if (dynamicFields) {
            this.renderer.setProperty(dynamicFields, 'innerHTML', '');
        }

        const input = this.renderer.createElement('input');
        this.renderer.setAttribute(input, 'type', 'text');
        this.renderer.setAttribute(input, 'id', 'reason');
        this.renderer.setAttribute(input, 'name', 'reason');
        this.renderer.setAttribute(input, 'placeholder', 'Reason');
        this.renderer.addClass(input, 'dynamic-input');
        this.renderer.setProperty(input, 'required', false);
        if (familyTreeForm) {
            this.renderer.appendChild(familyTreeForm, input);
        }
        if (dynamicFields) {
            this.renderer.appendChild(dynamicFields, input);
        }

        const suggestDeleteButton = this.renderer.createElement('button');
        this.renderer.setProperty(suggestDeleteButton, 'textContent', 'Suggest Delete');
        this.renderer.addClass(suggestDeleteButton, 'delete-button');
        // @ts-ignore
        this.renderer.listen(suggestDeleteButton, 'click', async (e) => {
            e.preventDefault();
            const formData = new FormData(familyTreeForm as HTMLFormElement);
            // @ts-ignore
            const deletionBody: formDataEntries = Object.fromEntries(formData.entries());
            if (input.value) deletionBody['reason'] = input.value;

            await suggestionCreationService.suggestDeleteNode(this.familyTreeId, nodeData.id, deletionBody);
            const nodesArray = await nodeManagmentService.fetchNodesArrays(this.familyTreeId);
            if (nodesArray) {
                this.treeDrawer.fetchData(nodesArray, nodeData.id, true);
            }
            this.htmlElementsManager.createViewMode(nodeData, memberPriviledge);
        });

        const deleteButtonNo = this.renderer.createElement('button');
        this.renderer.setProperty(deleteButtonNo, 'textContent', 'No');
        this.renderer.addClass(deleteButtonNo, 'dynamic-input');
        this.renderer.listen(deleteButtonNo, 'click', () => {
            this.htmlElementsManager.createViewMode(nodeData, memberPriviledge);
        });

        if (dynamicFields) {
            this.renderer.appendChild(dynamicFields, suggestDeleteButton);
            this.renderer.appendChild(dynamicFields, deleteButtonNo);
        }
    }

    createSuggestionMode(nodeData: FamilyNode, memberPriviledge: MemberPriviledge) {
        const dynamicFields = this.elementRef.nativeElement.querySelector('#dynamicFields');
        if (dynamicFields) {
            this.renderer.setProperty(dynamicFields, 'innerHTML', '');
        }

        const formData: { [key: string]: HTMLInputElement } = {};
        const reasonInput = this.renderer.createElement('input');
        this.renderer.setAttribute(reasonInput, 'type', 'text');
        this.renderer.setAttribute(reasonInput, 'id', 'reason');
        this.renderer.setAttribute(reasonInput, 'name', 'reason');
        this.renderer.setAttribute(reasonInput, 'placeholder', 'Reason');
        this.renderer.addClass(reasonInput, 'dynamic-input');
        this.renderer.setProperty(reasonInput, 'required', false);
        if (dynamicFields) {
            this.renderer.appendChild(dynamicFields, reasonInput);
        }

        ['name', 'title', 'phone', 'address', 'nickName', 'birthDate', 'deathDate'].forEach((key) => {
            const input = this.renderer.createElement('input');
            this.renderer.setAttribute(input, 'type', key.includes('Date') ? 'date' : key.includes('Id') ? 'number' : 'text');
            this.renderer.setAttribute(input, 'name', key);
            this.renderer.setAttribute(input, 'placeholder', key);
            this.renderer.setProperty(input, 'value', nodeData[key as keyof FamilyNode] as string || '');
            this.renderer.addClass(input, 'dynamic-input');
            if (dynamicFields) {
                this.renderer.appendChild(dynamicFields, input);
            }
            formData[key] = input;
        });

        const saveButton = this.renderer.createElement('button');
        this.renderer.setProperty(saveButton, 'textContent', 'Save Suggestion');
        this.renderer.addClass(saveButton, 'dynamic-input');
        // @ts-ignore
        this.renderer.listen(saveButton, 'click', async (e) => {
            e.preventDefault();
            const familyTreeForm = this.elementRef.nativeElement.querySelector('#familyTreeForm');
            const formData = new FormData(familyTreeForm as HTMLFormElement);
            // @ts-ignore
            const filteredData: formDataEntries = Object.fromEntries(formData.entries());

            Object.keys(formData).forEach(key => {
                if (formData.get(key) && formData.get(key) !== nodeData[key as keyof FamilyNode]) {
                } else {
                    delete filteredData[key];
                }
            });

            await suggestionCreationService.suggestUpdateNode(this.familyTreeId, nodeData.id, filteredData);
            const nodesArray = await nodeManagmentService.fetchNodesArrays(this.familyTreeId);
            if (nodesArray) {
                this.treeDrawer.fetchData(nodesArray, nodeData.id, true);
            }
            const rootNode = this.nodeManager.getNode(nodeData.id);
            this.htmlElementsManager.createViewMode(rootNode, memberPriviledge);
        });

        const cancelButton = this.renderer.createElement('button');
        this.renderer.setProperty(cancelButton, 'textContent', 'Cancel');
        this.renderer.addClass(cancelButton, 'dynamic-input');
        this.renderer.listen(cancelButton, 'click', () => {
            this.htmlElementsManager.createViewMode(nodeData, memberPriviledge);
        });

        if (dynamicFields) {
            this.renderer.appendChild(dynamicFields, saveButton);
            this.renderer.appendChild(dynamicFields, cancelButton);
        }
    }
}