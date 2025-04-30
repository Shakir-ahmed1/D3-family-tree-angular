import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { Contributor, DrawableNode, FamilyNode, genericActionTypes, MemberPriviledge, SuggestableActions, SuggestEdits } from '../interfaces/node.interface';
import { DataManager } from './data-manager';
import { FamilyTreeDrawer } from '../FamilyTreeDrawer';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class HtmlElementsManagerService {
    private treeDrawer: FamilyTreeDrawer;
    private familyTreeId: number;
    private rootNodeId: number;
    public nodeManager: DataManager;

    // Observable for active tab
    private activeTabSubject = new BehaviorSubject<string>('details');
    activeTab$ = this.activeTabSubject.asObservable();

    // Observable for mode type
    private modeTypeSubject = new BehaviorSubject<string>('View');
    modeType$ = this.modeTypeSubject.asObservable();

    private relationType = [
        { id: 'UNKNOWN', name: 'UNKNOWN' },
        { id: 'EX', name: 'EX' },
        { id: 'FRIEND', name: 'FRIEND' },
        { id: 'MAIN', name: 'MAIN' },
    ];

    constructor() { }

    initialize(ND: DataManager, familyTreeId: number, rootNodeId: number, drawer: FamilyTreeDrawer) {
        this.treeDrawer = drawer;
        this.rootNodeId = rootNodeId;
        this.familyTreeId = familyTreeId;
        this.nodeManager = ND;
        this.initTabs();

        const modeButton = document.getElementById('modeType');
        modeButton?.addEventListener('click', (_event) => {
            this.treeDrawer.toggleModes();
        });
    }

    setModeType(text: string) {
        this.modeTypeSubject.next(text);
    }

    private initTabs() {
        document.getElementById('detailsTab')?.addEventListener('click', () => this.showTab('details'));
        document.getElementById('imagesTab')?.addEventListener('click', () => this.showTab('images'));
    }

    showTab(tab: string) {
        this.activeTabSubject.next(tab);
    }

    // Other methods will be moved here with proper Angular patterns
    reviewUpdateSuggestionBody(suggestionObject: SuggestEdits) {
        // Implementation will be moved here
    }

    reviewDeletionSuggestionBody(suggestionObject: SuggestEdits) {
        // Implementation will be moved here
    }
} 