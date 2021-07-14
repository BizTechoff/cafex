
import { extend, openDialog } from "@remult/angular";
import { BoolColumn, checkForDuplicateValue, ColumnSettings, Context, EntityClass, Filter, IdEntity, LookupColumn, ServerMethod, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { changeDate, FILTER_IGNORE } from '../shared/types';
import { validString } from "../shared/utils";
import { Roles } from './roles';
import { UserProduct } from "./userProduct";

@EntityClass
export class Users extends IdEntity {
    name = new StringColumn({
        caption: "שם",
        validate: () => {
            if (!validString(this.name, { notNull: true, minLength: 3 })) {
                throw this.name.defs.caption + ': ' + this.name.validationError;
            }
        }
    });
    password = new PasswordColumn({
        caption: "סיסמה",
        includeInApi: false
    });
    createDate = new changeDate({ caption: 'נוצר ב' });

    admin = new BoolColumn({
        allowApiUpdate: Roles.admin, caption: "מנהל",
        valueChange: () => {
            if (this.admin.value) {
                this.technician.value = false;
                this.agent.value = false;
                this.store.value = false;
            }
        }
    });
    technician = new BoolColumn({
        allowApiUpdate: Roles.admin, caption: "טכנאי",
        valueChange: () => {
            if (this.technician.value) {
                this.admin.value = false;
                this.agent.value = false;
                this.store.value = false;
            }
        }
    });
    agent = new BoolColumn({
        allowApiUpdate: Roles.admin, caption: "סוכן",
        valueChange: () => {
            if (this.agent.value) {
                this.admin.value = false;
                this.technician.value = false;
                this.store.value = false;
            }
        }
    });
    store = new BoolColumn({
        allowApiUpdate: Roles.admin, caption: "בית קפה",
        valueChange: () => {
            if (this.store.value) {
                this.admin.value = false;
                this.technician.value = false;
                this.agent.value = false;
            }
        }
    });

    defaultStore = new UserId(this.context, Roles.store, { caption: "חנות בר.מחדל" });
    branch = new StringColumn({ caption: "סניף" });

    constructor(private context: Context) {

        super({
            name: "Users",
            allowApiRead: context.isSignedIn(),
            allowApiDelete: Roles.admin,
            allowApiUpdate: context.isSignedIn(),
            allowApiInsert: [Roles.admin, Roles.agent],
            defaultOrderBy: () => [
                { column: this.admin, descending: true },
                { column: this.technician, descending: true },
                { column: this.agent, descending: true },
                { column: this.store, descending: true },
                this.name
            ],
            saving: async () => {
                if (context.onServer) {

                    if (this.isNew()) {
                        this.createDate.value = new Date();
                        if ((await context.for(Users).count()) == 0)
                            this.admin.value = true;// If it's the first user, make it an admin
                    }
                    await checkForDuplicateValue(this, this.name, this.context.for(Users));

                }
            }//,
            // apiDataFilter: () => {
            //     if (!(context.isAllowed([Roles.admin,Roles.agent])))
            //         return this.id.isEqualTo(this.context.user.id);
            //     return new Filter(() => { });
            // }
        });
    }
    @ServerMethod({ allowed: true })
    async create(password: string) {
        if (!this.isNew())
            throw "פעולה לא חוקית";
        await this.password.hashAndSet(password);
        await this.save();
    }
    @ServerMethod({ allowed: context => context.isSignedIn() })
    async updatePassword(password: string) {
        if (this.isNew() || this.id.value != this.context.user.id)
            throw "פעולה לא חוקית";
        await this.password.hashAndSet(password);
        await this.save();
    }
    count: number;
    getCount() {
        if (this.count !== undefined)
            return this.count;
        this.count = 0;
        this.context.for(UserProduct).count(c => c.uid.isEqualTo(this.id)).then(result => { this.count = result; })
        return this.count;
    }
}



export class UserId extends LookupColumn<Users> {

    constructor(context: Context, role: string, settings?: ColumnSettings<string>) {
        super(context.for(Users), {
            caption: 'משתמש',
            displayValue: () => this.item.name.value
            , ...settings
        });
        // extend(this).dataControl(ctrl => {
        //     ctrl.getValue = () => this.displayValue;
        //     ctrl.hideDataOnInput = true;
        //     ctrl.width = '200';

        //     ctrl.click = async () => {
        //         await openDialog(DynamicServerSideSearchDialogComponent,
        //             dlg => dlg.args(Users, {
        //                 onClear: () => this.value = '',
        //                 onSelect: cur => this.value = cur.id.value,
        //                 searchColumn: cur => cur.name,
        //                 where: cur => cur.store.isEqualTo(true)
        //                 // role && role === Roles.store
        //                 //     ? cur.store.isEqualTo(true)
        //                 //     : FILTER_IGNORE
        //             })
        //             );
        //     };
        // });
    }

}
export class PasswordColumn extends StringColumn {

    constructor(settings?: ColumnSettings<string>) {
        super({
            ...{ caption: 'סיסמה', inputType: 'password' },
            ...settings
        })
    }
    async hashAndSet(password: string) {
        this.value = (await import('password-hash')).generate(password);
    }
    async matches(password: string) {
        return !this.value || (await import('password-hash')).verify(password, this.value);
    }
}

