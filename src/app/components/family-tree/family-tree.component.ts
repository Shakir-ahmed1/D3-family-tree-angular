import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';
import { FamilyTreeDrawer } from '../../FamilyTreeDrawer';
import { DataManager } from '../../services/data-manager';
import { HtmlElementsManagerService } from '../../services/html-elements-manager.service';

@Component({
    selector: 'app-family-tree',
    templateUrl: './family-tree.component.html',
    styleUrls: ['./family-tree.component.scss']
})
export class FamilyTreeComponent implements OnInit, AfterViewInit {
    @ViewChild('treeContainer') treeContainer: ElementRef;

    private treeDrawer: FamilyTreeDrawer;
    private dataManager: DataManager;
    private familyTreeId: number = 1; // This should come from your route or service
    private rootNodeId: number = 1; // This should come from your route or service

    // Template variables
    activeTab: string = 'details';
    modeType: string = 'View';

    constructor(private htmlElementsManager: HtmlElementsManagerService) {
        // Subscribe to service observables
        this.htmlElementsManager.activeTab$.subscribe(tab => {
            this.activeTab = tab;
        });

        this.htmlElementsManager.modeType$.subscribe(mode => {
            this.modeType = mode;
        });
    }

    ngOnInit() {
        // Initialize services and data
        this.dataManager = new DataManager();
        this.treeDrawer = new FamilyTreeDrawer(
            this.dataManager,
            this.familyTreeId,
            '#treeContainer',
            800, // width
            600, // height
            false
        );
    }

    ngAfterViewInit() {
        // Initialize the tree drawer after view is ready
        this.treeDrawer.intialize();
        this.htmlElementsManager.initialize(
            this.dataManager,
            this.familyTreeId,
            this.rootNodeId,
            this.treeDrawer
        );
    }

    // Template methods
    onTabClick(tab: string) {
        this.htmlElementsManager.showTab(tab);
    }

    onModeToggle() {
        this.treeDrawer.toggleModes();
    }
} 