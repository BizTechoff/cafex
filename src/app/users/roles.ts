import { SignedInGuard } from '@remult/angular';
import { Injectable } from '@angular/core';



export const Roles = {
    admin: 'admin',
    store: 'store',
    agent: 'agent',
    technician: 'technician'
}


@Injectable()
export class AdminGuard extends SignedInGuard {

    isAllowed() {
        return Roles.admin;
    }
}

@Injectable()
export class TechnicianGuard extends SignedInGuard {

    isAllowed() {
        return Roles.technician;
    }
}
@Injectable()
export class AgentGuard extends SignedInGuard {

    isAllowed() {
        return Roles.agent;
    }
}
@Injectable()
export class StoreGuard extends SignedInGuard {

    isAllowed() {
        return Roles.store;
    }
}

@Injectable()
export class TechnicianOrAdminGuard extends SignedInGuard {

    isAllowed() {
        return [Roles.technician, Roles.admin];
    }
}
