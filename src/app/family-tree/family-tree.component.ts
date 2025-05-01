import { Component, AfterViewInit, Renderer2, ElementRef } from '@angular/core';
import { localStorageManager } from '../services/storage-manager';
import { FamilyTreeDrawer } from '../FamilyTreeDrawer';
import { DataManager } from '../services/data-manager';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './family-tree.component.html',
  styleUrl: './family-tree.component.scss'
})
export class FamilyTreeComponent implements AfterViewInit {
  private drawer: FamilyTreeDrawer | undefined;

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    // USER 1
    const bearerToken = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6IisxMjM0NTY3ODkwMSIsImlhdCI6MTczNzI3MTkzOSwiZXhwIjoxODM3MzU4MzM5fQ.xyGMhsv6dcywwy7AImYvcFwxHWdvlAidvg-7M7ZeBB8`;

    localStorageManager.setItem('bearerToken', bearerToken);

    const familyTreeId = 1;
    const dataManager = new DataManager(familyTreeId);

    this.drawer = new FamilyTreeDrawer(
      dataManager,
      familyTreeId,
      '#treeContainer',
      500,
      500,
      false,
      undefined,
      this.renderer,
      this.elementRef
    );

    const sizeManagerForm = this.elementRef.nativeElement.querySelector('#sizeManager') as HTMLFormElement;

    if (sizeManagerForm) {
      this.renderer.listen(sizeManagerForm, 'submit', (event) => {
        event.preventDefault();
        const sizeInput = this.elementRef.nativeElement.querySelector('#size') as HTMLInputElement;
        const size = parseInt(sizeInput.value, 10);
        this.drawer?.updateSVGSize(size);
      });
    } else {
      console.error("Size manager form not found.");
    }
  }
}