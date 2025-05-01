import { ElementRef, Renderer2 } from '@angular/core';
import { CreateNewPrimaryFamilyNodeInterface } from "../interfaces/dtos/create-new-primary-family-node.dto";
import { Gender } from "../interfaces/dtos/gender.enum";
import { SuggestUpdateNodeInteface } from "../interfaces/dtos/suggest.dto";
import { Contributor, FamilyNode, FamilyTreeMembers, formDataEntries } from "../interfaces/node.interface";
import { userService } from "../services/user.service";

export function otherNodeDetails(familyNode: FamilyNode, renderer: Renderer2) {
    const wrapper = renderer.createElement('div');

    // Create the title and toggle button container
    const titleWrapper = renderer.createElement('div');
    renderer.setStyle(titleWrapper, 'display', 'flex');
    renderer.setStyle(titleWrapper, 'alignItems', 'center');
    renderer.setStyle(titleWrapper, 'cursor', 'pointer');
    renderer.setStyle(titleWrapper, 'width', '100%');

    const title = renderer.createElement('p');
    renderer.setProperty(title, 'textContent', 'Other details');
    renderer.setStyle(title, 'fontSize', '20px');
    renderer.setStyle(title, 'margin', '0');
    renderer.setStyle(title, 'flexShrink', '0');

    const line = renderer.createElement('hr');
    renderer.setStyle(line, 'flexGrow', '1');
    renderer.setStyle(line, 'marginLeft', '10px');

    renderer.appendChild(titleWrapper, title);
    renderer.appendChild(titleWrapper, line);
    renderer.appendChild(wrapper, titleWrapper);

    // Content container (initially hidden)
    const contentWrapper = renderer.createElement('div');
    renderer.setStyle(contentWrapper, 'display', 'none');
    renderer.setStyle(contentWrapper, 'marginLeft', '30px');

    function memberFormer(title: string, member: any) {
        const membersContainer = renderer.createElement('div');
        renderer.setStyle(membersContainer, 'border', 'gray 1px solid');
        renderer.setStyle(membersContainer, 'display', 'flex');
        renderer.setStyle(membersContainer, 'alignItems', 'center');
        renderer.setStyle(membersContainer, 'paddingLeft', '10px');

        const creatorsTitle = renderer.createElement('p');
        renderer.setProperty(creatorsTitle, 'textContent', title + ':');
        renderer.setStyle(creatorsTitle, 'marginRight', '20px');

        renderer.appendChild(membersContainer, creatorsTitle);

        const memberElement = createUserProfileElement(member, renderer);
        renderer.appendChild(membersContainer, memberElement as Node);

        return membersContainer;
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    function createInfoRow(label: string, value: string) {
        const infoRow = renderer.createElement('div');
        renderer.setStyle(infoRow, 'display', 'flex');
        renderer.setStyle(infoRow, 'alignItems', 'center');

        const labelElement = renderer.createElement('p');
        renderer.setProperty(labelElement, 'textContent', `${label}:`);
        renderer.setStyle(labelElement, 'marginRight', '10px');
        renderer.setStyle(labelElement, 'fontWeight', 'bold');

        const valueElement = renderer.createElement('p');
        renderer.setProperty(valueElement, 'textContent', value);

        renderer.appendChild(infoRow, labelElement);
        renderer.appendChild(infoRow, valueElement);

        return infoRow;
    }

    if (familyNode.ownedBy) {
        renderer.appendChild(contentWrapper, memberFormer('Owned by', familyNode.ownedBy));
    }
    if (familyNode.createdBy) {
        renderer.appendChild(contentWrapper, memberFormer('Created by', familyNode.createdBy));
    }
    if (familyNode.suggestedBy) {
        renderer.appendChild(contentWrapper, memberFormer('Suggested by', familyNode.suggestedBy));
    }

    if (familyNode.createdAt) {
        renderer.appendChild(contentWrapper, createInfoRow('Created at', formatDate(JSON.stringify(familyNode.createdAt))));
    }
    if (familyNode.updatedAt) {
        renderer.appendChild(contentWrapper, createInfoRow('Updated at', formatDate(JSON.stringify(familyNode.updatedAt))));
    }

    renderer.appendChild(wrapper, contentWrapper);

    // Toggle functionality
    renderer.listen(titleWrapper, 'click', (e) => {
        e.preventDefault();
        const currentDisplay = contentWrapper.style.display;
        renderer.setStyle(contentWrapper, 'display', currentDisplay === 'none' ? 'block' : 'none');
    });

    return wrapper;
}

export function generateTemporaryProfilePicture(userName: string, renderer: Renderer2) {
    const firstLetter = userName.charAt(0).toUpperCase();
    const colorIndex = userName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 8;
    const bgColor1 = backgroundColors[colorIndex];
    const bgColor2 = backgroundColors[(colorIndex + 3) % 8]; // Second color for gradient

    const canvas = renderer.createElement('canvas');
    renderer.setProperty(canvas, 'width', 80);
    renderer.setProperty(canvas, 'height', 80);
    const ctx = canvas.getContext('2d');

    if (ctx) {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, bgColor1 as string);
        gradient.addColorStop(1, bgColor2 as string);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(firstLetter, canvas.width / 2, canvas.height / 2);
    }

    return canvas.toDataURL();
}

export function createUserProfileElement(familyTreeMember: FamilyTreeMembers, renderer: Renderer2) {
    if (!familyTreeMember || !familyTreeMember.user) {
        console.error('Invalid familyTreeMember object');
        return null;
    }

    const container = renderer.createElement('div');
    renderer.setStyle(container, 'display', 'flex');
    renderer.setStyle(container, 'alignItems', 'center');
    renderer.setStyle(container, 'gap', '10px');
    renderer.setStyle(container, 'padding', '10px 2px');

    // Create name element
    const nameElement = renderer.createElement('span');
    renderer.setProperty(nameElement, 'textContent', familyTreeMember.user.name);
    renderer.setStyle(nameElement, 'fontSize', '16px');
    renderer.setStyle(nameElement, 'fontWeight', 'bold');

    // Create profile picture element
    const profilePic = renderer.createElement('img');
    renderer.setAttribute(profilePic, 'alt', `${familyTreeMember.user.name}'s profile picture`);
    renderer.setStyle(profilePic, 'width', '40px');
    renderer.setStyle(profilePic, 'height', '40px');
    renderer.setStyle(profilePic, 'borderRadius', '50%');
    renderer.setStyle(profilePic, 'objectFit', 'cover');

    // Fetch profile picture from UserService
    userService.getUserProfilePicture(familyTreeMember.user.id)
        .then(response => {
            if (!response.ok) {
                throw new Error('No profile picture available');
            }
            return response.blob();
        })
        .then(blob => {
            renderer.setProperty(profilePic, 'src', URL.createObjectURL(blob));
        })
        .catch(() => {
            // Generate temporary profile picture if the user has no profile picture
            const tempSrc = generateTemporaryProfilePicture(familyTreeMember.user.name, renderer);
            renderer.setProperty(profilePic, 'src', tempSrc);
        });

    // Append elements in order
    renderer.appendChild(container, profilePic);
    renderer.appendChild(container, nameElement);

    return container;
}

export const backgroundColors = ['#1E1E1E', '#2C3E50', '#34495E', '#8E44AD', '#C0392B', '#16A085', '#D35400', '#2980B9'];

export function contributorDetailElement(title: string, contributors: FamilyTreeMembers[], renderer: Renderer2) {
    const wrapper = renderer.createElement('div');
    const creatorsTitle = renderer.createElement('p');
    renderer.setProperty(creatorsTitle, 'textContent', title);
    renderer.appendChild(wrapper, creatorsTitle);
    contributors.forEach(item => {
        const creator = createUserProfileElement(item, renderer);
        renderer.appendChild(wrapper, creator as Node);
    });
    return wrapper;
}

export function contributorsElementGenerator(contributors: Contributor, renderer: Renderer2) {
    const contributionWrapper = renderer.createElement('div');

    // Create the title and toggle button container
    const titleWrapper = renderer.createElement('div');
    renderer.setStyle(titleWrapper, 'display', 'flex');
    renderer.setStyle(titleWrapper, 'alignItems', 'center');
    renderer.setStyle(titleWrapper, 'cursor', 'pointer');
    renderer.setStyle(titleWrapper, 'width', '100%');

    const title = renderer.createElement('p');
    renderer.setProperty(title, 'textContent', 'Allowed contributors');
    renderer.setStyle(title, 'fontSize', '20px');
    renderer.setStyle(title, 'margin', '0');
    renderer.setStyle(title, 'flexShrink', '0');

    const line = renderer.createElement('hr');
    renderer.setStyle(line, 'flexGrow', '1');
    renderer.setStyle(line, 'marginLeft', '10px');

    renderer.appendChild(titleWrapper, title);
    renderer.appendChild(titleWrapper, line);
    renderer.appendChild(contributionWrapper, titleWrapper);

    const contentWrapper = renderer.createElement('div');
    renderer.setStyle(contentWrapper, 'display', 'none');
    renderer.setStyle(contentWrapper, 'marginLeft', '30px');

    if (contributors) {
        renderer.appendChild(contentWrapper, contributorDetailElement('creators', contributors.creators, renderer));
        renderer.appendChild(contentWrapper, renderer.createElement('hr'));
        renderer.appendChild(contentWrapper, contributorDetailElement('updators', contributors.updators, renderer));
        renderer.appendChild(contentWrapper, renderer.createElement('hr'));
        renderer.appendChild(contentWrapper, contributorDetailElement('suggestors', contributors.suggestors, renderer));
    }

    renderer.appendChild(contributionWrapper, contentWrapper);

    // Toggle functionality
    renderer.listen(contributionWrapper, 'click', (e) => {
        e.preventDefault();
        const currentDisplay = contentWrapper.style.display;
        renderer.setStyle(contentWrapper, 'display', currentDisplay === 'none' ? 'block' : 'none');
    });

    return contributionWrapper;
}

export function createDropdown(
    nodes: { id: string; name: string }[],
    identifier: string,
    message: string,
    zeroMessage: string,
    renderer: Renderer2
): HTMLSelectElement {
    const select = renderer.createElement('select');
    renderer.setAttribute(select, 'id', identifier);
    renderer.setAttribute(select, 'name', identifier);
    renderer.addClass(select, 'dynamic-input');

    // Handle the case where there are no nodes
    if (nodes.length === 0) {
        const defaultOption = renderer.createElement('option');
        renderer.setProperty(defaultOption, 'textContent', zeroMessage);
        renderer.setAttribute(defaultOption, 'value', '');
        renderer.appendChild(select, defaultOption);
        renderer.setProperty(select, 'disabled', true);

        return select;
    }

    // Create and append the default instructional option
    const defaultOption = renderer.createElement('option');
    renderer.setProperty(defaultOption, 'textContent', message);
    renderer.setAttribute(defaultOption, 'value', '');
    renderer.appendChild(select, defaultOption);

    // Create and append options for each node
    nodes.forEach(node => {
        const option = renderer.createElement('option');
        renderer.setAttribute(option, 'value', node.id);
        renderer.setProperty(option, 'textContent', node.name);
        renderer.appendChild(select, option);
    });

    return select;
}

export function hoverEffect(hoverHandler: (familyNodeId: number) => void, nodeId: number, renderer: Renderer2, elementRef: ElementRef) {
    const div = renderer.createElement('div');
    renderer.setProperty(div, 'textContent', 'HOVER EFFECT TEST???');

    renderer.listen(div, 'mouseover', () => {
        if (typeof hoverHandler === 'function') {
            const popup = elementRef.nativeElement.querySelector('#treePopUp');
            if (popup) {
                renderer.setStyle(popup, 'display', 'block');
            }
            hoverHandler(nodeId);
        }
    });

    renderer.listen(div, 'mouseout', () => {
        const popup = elementRef.nativeElement.querySelector('#treePopUp');
        if (popup) {
            renderer.setStyle(popup, 'display', 'none');
            renderer.setProperty(popup, 'innerHTML', '');
        }
    });

    return div;
}

export function stringMin(str1: string, str2: string) {
    return str1.localeCompare(str2) < 0 ? str1 : str2;
}

export function stringMax(str1: string, str2: string) {
    return str1.localeCompare(str2) > 0 ? str1 : str2;
}

export function constructNodeCreator(allData: formDataEntries): CreateNewPrimaryFamilyNodeInterface {
    console.log("allData", allData);
    const newNode: CreateNewPrimaryFamilyNodeInterface = {
        name: allData["name"] as string,
        address: allData["address"] as string,
        gender: allData["gender"] as Gender,
        nickName: allData["nickName"] as string,
        ownedById: allData["ownedById"] as unknown as number,
        phone: allData["phone"] as string,
        title: allData["title"] as string
    };
    if (allData["birthDate"]) { newNode.birthDate = allData["birthDate"] as Date; }
    if (allData["deathDate"]) { newNode.deathDate = allData["deathDate"] as Date; }

    return newNode;
}

export function constructNodeUpdateSuggestor(allData: formDataEntries): SuggestUpdateNodeInteface {
    const newNode: SuggestUpdateNodeInteface = {
        name: allData["name"] as string,
        address: allData["address"] as string,
        nickName: allData["nickName"] as string,
        phone: allData["phone"] as string,
        title: allData["title"] as string,
        reason: allData["reason"] as string,
    };
    if (allData["birthDate"]) { newNode.birthDate = allData["birthDate"] as Date; }
    if (allData["deathDate"]) { newNode.deathDate = allData["deathDate"] as Date; }

    return newNode;
}