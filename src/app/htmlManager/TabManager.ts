import { Renderer2, ElementRef } from '@angular/core';
import { DataManager } from "../services/data-manager";
import { HtmlElementsManager } from "./htmlElementsManager";

export class TabManager {
    private htmlElementsManager: HtmlElementsManager;
    private nodeManager: DataManager;
    private familyTreeId: number;
    private renderer: Renderer2;
    private elementRef: ElementRef;

    constructor(
        htmlElementsManager: HtmlElementsManager,
        nodeManager: DataManager,
        familyTreeId: number,
        renderer: Renderer2,
        elementRef: ElementRef
    ) {
        this.htmlElementsManager = htmlElementsManager;
        this.nodeManager = nodeManager;
        this.familyTreeId = familyTreeId;
        this.renderer = renderer;
        this.elementRef = elementRef;
        this.initTabs();
    }

    initTabs() {
        // Helper function to add click listener to a tab
        const addTabListener = (tabId: string, tabName: string) => {
            const tabElement = this.elementRef.nativeElement.querySelector(`#${tabId}`);
            if (tabElement) {
                this.renderer.listen(tabElement, 'click', () => {
                    this.htmlElementsManager.showTab(tabName);
                    console.log(`Tab clicked: ${tabName}`);
                });
            }
        };

        // Add click listeners to existing tabs
        addTabListener('detailsTab', 'details');
        addTabListener('imagesTab', 'images');
        addTabListener('notesTab', 'notes');

        // Conditionally add editSuggestionsTab
        if (this.nodeManager?.data?.canContribute) {
            const editTab = this.renderer.createElement('div');
            this.renderer.addClass(editTab, 'tab');
            this.renderer.setAttribute(editTab, 'id', 'editSuggestionsTab');
            this.renderer.setProperty(editTab, 'textContent', 'Edit Suggestions');

            // Add click listener to editTab
            this.renderer.listen(editTab, 'click', () => {
                this.htmlElementsManager.showTab('editSuggestions');
            });

            // Insert editTab after notesTab
            const notesTab = this.elementRef.nativeElement.querySelector('#notesTab');
            if (notesTab && notesTab.parentNode) {
                this.renderer.insertBefore(notesTab.parentNode, editTab, notesTab.nextSibling);
            }
        }
    }
}