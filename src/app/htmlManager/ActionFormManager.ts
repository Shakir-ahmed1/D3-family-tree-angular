import { Renderer2, ElementRef } from '@angular/core';
import { FamilyTreeDrawer } from "../FamilyTreeDrawer";
import { genericActionTypes, DrawableNode } from "../interfaces/node.interface";
import { DataManager } from "../services/data-manager";
import { nodeCreationService } from "../services/node-creation-services";
import { nodeManagmentService } from "../services/node-managment-service";
import { localStorageManager } from "../services/storage-manager";
import { suggestionCreationService } from "../services/suggestion-creation-service";
import { hoverEffect, createDropdown } from "../utils/utils";
import { HtmlElementsManager } from "./htmlElementsManager";

export class ActionFormManager {
    private htmlElementsManager: HtmlElementsManager;
    private nodeManager: DataManager;
    private familyTreeId: number;
    private treeDrawer: FamilyTreeDrawer;
    private renderer: Renderer2;
    private elementRef: ElementRef;
    private relationType = [
        { id: 'UNKNOWN', name: 'UNKNOWN' },
        { id: 'EX', name: 'EX' },
        { id: 'FRIEND', name: 'FRIEND' },
        { id: 'MAIN', name: 'MAIN' },
    ];

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

    setActionTypeLabel(actionType: genericActionTypes, node: d3.HierarchyNode<DrawableNode>, currentNodeId: number) {
        this.htmlElementsManager.setRootNodeId(currentNodeId);
        const memberPriviledge = this.nodeManager.memberPriviledge(this.familyTreeId, currentNodeId);
        const currentMemberMode = (memberPriviledge === 'create' || memberPriviledge === 'only-create') ? 'create' : 'suggest';
        const dynamicFields = this.elementRef.nativeElement.querySelector('#dynamicFields');

        if (dynamicFields) {
            this.renderer.setProperty(dynamicFields, 'innerHTML', '');
        }
        const hoverEffectTest = hoverEffect(this.treeDrawer.createPopUp, currentNodeId, this.renderer, this.elementRef);
        if (dynamicFields && hoverEffectTest) {
            this.renderer.appendChild(dynamicFields, hoverEffectTest);
        }

        const endpointFieldMapNew = {
            addParent: {
                new: {
                    endpoint: { create: 'addNewParent', suggest: 'suggestNewParent' },
                    label: { create: { MALE: "Add New Father", FEMALE: "Add New Mother" }, suggest: { MALE: "Suggest New Father", FEMALE: "Suggest New Mother" } },
                    fields: ['partnerNodeData']
                },
                existing: {
                    endpoint: { create: 'addExistingParent', suggest: 'suggestExistingParent' },
                    label: { create: { MALE: "Add Existing Father", FEMALE: "Add Existing Mother" }, suggest: { MALE: "Suggest Existing Father", FEMALE: "Suggest Existing Mother" } },
                    fields: ['partnershipType', 'targetNodeId']
                },
            },
            addChildOfTwoParents: {
                new: {
                    endpoint: { create: 'addChildOfTwoParents', suggest: 'suggestChildOfTwoParents' },
                    label: { create: { MALE: "Add Son of Two Parents", FEMALE: "Add Daughter of Two Parents" }, suggest: { MALE: "Suggest Son of Two Parents", FEMALE: "Suggest Daughter of Two Parents" } },
                    fields: ['targetNodeId', 'childNodeData']
                },
                existing: null
            },
            addChildOfOneParent: {
                new: {
                    endpoint: { create: 'addChildOfOneParent', suggest: 'suggestChildOfOneParent' },
                    label: { create: { MALE: "Add Son of One Parent", FEMALE: "Add Daughter of One Parent" }, suggest: { MALE: "Suggest Son of One Parent", FEMALE: "Suggest Daughter of One Parent" } },
                    fields: ['childNodeData']
                },
                existing: null
            },
            addPartner: {
                new: {
                    endpoint: { create: 'addNewPartner', suggest: 'suggestNewPartner' },
                    label: { create: { MALE: "Add New Partner", FEMALE: "Add New Partner" }, suggest: { MALE: "Suggest New Partner", FEMALE: "Suggest New Partner" } },
                    fields: ['partnershipType', 'partnerNodeData']
                },
                existing: {
                    endpoint: { create: 'addExistingPartner', suggest: 'suggestExistingPartner' },
                    label: { create: { MALE: "Add Existing Partner", FEMALE: "Add Existing Partner" }, suggest: { MALE: "Suggest Existing Partner", FEMALE: "Suggest Existing Partner" } },
                    fields: ['partnershipType', 'targetNodeId']
                },
            },
        };

        const generateFields = (option: 'new' | 'existing') => {
            if (!dynamicFields) return;

            // Remove existing dynamic inputs
            const existingInputs = dynamicFields.querySelectorAll('.dynamic-input');
            existingInputs.forEach((el: any) => this.renderer.removeChild(dynamicFields, el));

            // Add reason input for suggest mode
            if (currentMemberMode === 'suggest') {
                const input = this.renderer.createElement('input');
                this.renderer.setAttribute(input, 'type', 'text');
                this.renderer.setAttribute(input, 'id', 'reason');
                this.renderer.setAttribute(input, 'name', 'reason');
                this.renderer.setAttribute(input, 'placeholder', 'Reason');
                this.renderer.setProperty(input, 'required', false);
                this.renderer.addClass(input, 'dynamic-input');
                this.renderer.appendChild(dynamicFields, input);
            }

            const fields = actionOptions[option]?.fields;
            fields?.forEach((field: string | null) => {
                if (field?.includes('Data')) {
                    const h2 = this.renderer.createElement('h2');
                    this.renderer.setProperty(h2, 'textContent', field);
                    this.renderer.addClass(h2, 'dynamic-input');
                    this.renderer.appendChild(dynamicFields, h2);

                    ['name', 'gender', 'title', 'phone', 'address', 'nickName', 'birthDate', 'deathDate'].forEach(name => {
                        const input = this.renderer.createElement('input');
                        this.renderer.setAttribute(input, 'type', name.includes('Date') ? 'date' : 'text');
                        this.renderer.setAttribute(input, 'id', name);
                        this.renderer.setAttribute(input, 'name', name);
                        this.renderer.setAttribute(input, 'placeholder', name.replace(/([A-Z])/g, ' $1').trim());
                        this.renderer.setProperty(input, 'required', name === 'name' || name === 'gender');
                        this.renderer.addClass(input, 'dynamic-input');
                        if (name === 'gender') {
                            this.renderer.setProperty(input, 'value', node.data.gender);
                        }
                        this.renderer.appendChild(dynamicFields, input);
                    });
                } else if (field === 'targetNodeId' && actionType === genericActionTypes.addParent) {
                    nodeManagmentService.fetchAllowedParents(this.familyTreeId, currentNodeId, node.data.gender)
                        .then(item => {
                            const dropdown = createDropdown(item, 'targetNodeId', 'Select Existing parent Node', 'Couldn\'t find a possible parent', this.renderer);
                            const referenceElement = this.elementRef.nativeElement.querySelector('#actionOptionSelect');
                            if (referenceElement && referenceElement.parentNode === dynamicFields) {
                                this.renderer.insertBefore(dynamicFields, dropdown, referenceElement.nextSibling || null);
                            } else {
                                this.renderer.appendChild(dynamicFields, dropdown);
                            }
                        })
                        .catch(error => console.error("Error fetching marriable nodes:", error));
                } else if (field === 'targetNodeId' && actionType === genericActionTypes.addPartner) {
                    nodeManagmentService.fetchMarriableNodes(this.familyTreeId, currentNodeId)
                        .then(item => {
                            const dropdown = createDropdown(item, 'targetNodeId', 'Select Existing Node', 'Couldn\'t find a possible pair', this.renderer);
                            const referenceElement = this.elementRef.nativeElement.querySelector('#actionOptionSelect');
                            if (referenceElement && referenceElement.parentNode === dynamicFields) {
                                this.renderer.insertBefore(dynamicFields, dropdown, referenceElement.nextSibling || null);
                            } else {
                                this.renderer.appendChild(dynamicFields, dropdown);
                            }
                        })
                        .catch(error => console.error("Error fetching marriable nodes:", error));
                } else if (field === 'partnershipType') {
                    const dropdown = createDropdown(this.relationType, 'partnershipType', 'select relationship Status', 'Unknown Error Occurred', this.renderer);
                    this.renderer.appendChild(dynamicFields, dropdown);
                } else if (field?.endsWith('Id')) {
                    const input = this.renderer.createElement('input');
                    this.renderer.setAttribute(input, 'type', 'number');
                    this.renderer.setAttribute(input, 'name', field);
                    this.renderer.setAttribute(input, 'placeholder', field);
                    this.renderer.setProperty(input, 'required', true);
                    this.renderer.addClass(input, 'dynamic-input');
                    if (actionType === 'addChildOfTwoParents' && field === 'targetNodeId') {
                        const partnerId = node.data.motherId === currentNodeId ? node.data.fatherId : node.data.motherId;
                        if (input) this.renderer.setProperty(input, 'value', `${partnerId}`);
                        const p = this.renderer.createElement('p');
                        const partnerNode = this.nodeManager.getNode(partnerId as number);
                        this.renderer.setProperty(p, 'textContent', `Partner: ${partnerNode.name}`);
                        this.renderer.appendChild(dynamicFields, p);
                    }
                    this.renderer.appendChild(dynamicFields, input);
                } else {
                    const input = this.renderer.createElement('input');
                    this.renderer.setAttribute(input, 'type', 'text');
                    this.renderer.setAttribute(input, 'name', field as string);
                    this.renderer.setAttribute(input, 'placeholder', field as string);
                    this.renderer.setProperty(input, 'required', true);
                    this.renderer.addClass(input, 'dynamic-input');
                    this.renderer.appendChild(dynamicFields, input);
                }
            });

            const saveButton = this.renderer.createElement('button');
            this.renderer.setProperty(saveButton, 'textContent', 'Save');
            this.renderer.setAttribute(saveButton, 'id', 'allowed-save');
            this.renderer.addClass(saveButton, 'dynamic-input');
            // @ts-ignore
            this.renderer.listen(saveButton, 'click', async (e) => {
                const endpointServiceMap = {
                    addNewParent: nodeCreationService.addNewParent,
                    addExistingParent: nodeCreationService.addExistingParent,
                    addChildOfOneParent: nodeCreationService.addChildOfOneParent,
                    addChildOfTwoParents: nodeCreationService.addChildOfTwoParents,
                    addNewPartner: nodeCreationService.addNewPartner,
                    addExistingPartner: nodeCreationService.addExistingPartner,
                    suggestNewParent: suggestionCreationService.suggestNewParent,
                    suggestExistingParent: suggestionCreationService.suggestExistingParent,
                    suggestChildOfOneParent: suggestionCreationService.suggestChildOfOneParent,
                    suggestChildOfTwoParents: suggestionCreationService.suggestChildOfTwoParents,
                    suggestNewPartner: suggestionCreationService.suggestNewPartner,
                    suggestExistingPartner: suggestionCreationService.suggestExistingPartner,
                    suggestDeleteNode: suggestionCreationService.suggestDeleteNode,
                    suggestUpdateNode: suggestionCreationService.suggestUpdateNode,
                };
                type EndpointKey = keyof typeof endpointServiceMap;

                e.preventDefault();
                const familyTreeForm = this.elementRef.nativeElement.querySelector('#familyTreeForm');
                const formData = new FormData(familyTreeForm as HTMLFormElement);
                const endpoint = localStorageManager.getItem('postEndpoint') as EndpointKey | null;
                // @ts-ignore
                const data: { [key: string]: string } = Object.fromEntries(formData.entries());

                if (endpoint && endpoint in endpointServiceMap) {
                    try {
                        const serviceFunction = endpointServiceMap[endpoint];
                        await serviceFunction(this.familyTreeId, currentNodeId, data);
                        const nodesArray = await nodeManagmentService.fetchNodesArrays(this.familyTreeId);
                        if (nodesArray) {
                            this.treeDrawer.fetchData(nodesArray, currentNodeId, true);
                        }
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }

                const currentData = await this.nodeManager.getNode(currentNodeId);
                const memberPriviledge = this.nodeManager.memberPriviledge(this.familyTreeId, currentNodeId);
                this.htmlElementsManager.createViewMode(currentData, memberPriviledge);
            });
            this.renderer.appendChild(dynamicFields, saveButton);
        };

        const actionOptions = endpointFieldMapNew[actionType as keyof typeof endpointFieldMapNew];
        type ValidSelectValue = "new" | "existing";
        const actionKeys = actionType as keyof typeof endpointFieldMapNew;

        if (!actionOptions) return;

        if (actionOptions.existing && actionOptions.new) {
            const select = this.renderer.createElement('select');
            this.renderer.setAttribute(select, 'id', 'actionOptionSelect');
            ['existing', 'new'].forEach(option => {
                const opt = this.renderer.createElement('option');
                this.renderer.setProperty(opt, 'value', option);
                this.renderer.setProperty(opt, 'textContent', actionOptions[option as keyof typeof actionOptions].label[currentMemberMode][node.data.gender]);
                this.renderer.appendChild(select, opt);
            });

            this.renderer.listen(select, 'change', () => {
                const label = endpointFieldMapNew[actionKeys]?.[select.value as ValidSelectValue]?.label?.[currentMemberMode]?.[node.data.gender];
                const endpointLabel = this.elementRef.nativeElement.querySelector('#endpointLabel');
                if (endpointLabel) {
                    this.renderer.setProperty(endpointLabel, 'textContent', label ?? null);
                }
                localStorageManager.setItem('postEndpoint', endpointFieldMapNew[actionKeys]?.[select.value as ValidSelectValue]?.endpoint[currentMemberMode]);
                generateFields(select.value as 'new' | 'existing');
            });
            this.renderer.appendChild(dynamicFields, select);
            const label = endpointFieldMapNew[actionKeys]?.['existing' as ValidSelectValue]?.label[currentMemberMode][node.data.gender];
            localStorageManager.setItem('postEndpoint', endpointFieldMapNew[actionKeys]['existing' as ValidSelectValue]?.endpoint[currentMemberMode]);
            const endpointLabel = this.elementRef.nativeElement.querySelector('#endpointLabel');
            if (endpointLabel) {
                this.renderer.setProperty(endpointLabel, 'textContent', label ?? null);
            }
            generateFields('existing');
        } else {
            const option = (actionOptions.new ? 'new' : 'existing') as 'new' | 'existing';
            const label = endpointFieldMapNew[actionKeys][option]?.label[currentMemberMode][node.data.gender];
            const endpointLabel = this.elementRef.nativeElement.querySelector('#endpointLabel');
            if (endpointLabel) {
                this.renderer.setProperty(endpointLabel, 'textContent', label ?? null);
            }
            localStorageManager.setItem('postEndpoint', endpointFieldMapNew[actionKeys][option]?.endpoint[currentMemberMode]);
            generateFields(option);
        }
    }
}