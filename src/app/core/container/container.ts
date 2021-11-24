import { extend, openDialog } from "@remult/angular";
import { checkForDuplicateValue, ColumnSettings, Context, DateTimeColumn, EntityClass, IdEntity, LookupColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { FILTER_IGNORE } from "../../shared/types";
import { Roles } from "../../users/roles";
import { UserId } from "../../users/users";

@EntityClass
export class Container extends IdEntity {

    name = new StringColumn({ caption: 'שם' });
    sid = new UserId(this.context, Roles.store, { caption: "בית קפה" });
    aid = new UserId(this.context, Roles.agent, { caption: "סוכן" });
    created = new DateTimeColumn({ caption: 'נוצר' })
    createdBy = new UserId(this.context, Roles.admin, { caption: 'נוצר ע"י' });

    constructor(private context: Context) {
        super({
            name: 'containers',
            allowApiCRUD: true,
            allowApiRead: c => c.isSignedIn(),
            saving: async () => {
                if (context.onServer) {
                    await checkForDuplicateValue(this, this.name, this.context.for(Container));
                    if (this.isNew()) {
                        this.created.value = new Date();
                        this.createdBy.value = context.user.id;
                    }
                }
            }
        });
    }


    static async get(req: { id?: string, storeid?: string, agentid?: string }, context?: Context) {
        let result = "";

        for await (const c of context.for(Container).iterate({
            where: row => {
                let result = FILTER_IGNORE;
                if (req.id) {
                    result = result.and(row.id.isEqualTo(req.id));
                }
                else {
                    if (req.storeid) {
                        result = result.and(row.sid.isEqualTo(req.storeid));
                    }
                    if (req.agentid) {
                        result = result.and(row.aid.isEqualTo(req.agentid));
                    }
                }
                return result;
            }
        })) {
            result += `${c.id.value}|${c.name.value}|${c.sid.value}|${c.aid.value} \n`;
        }
        return result;
    }

    static async post(req: { id?: string, name?: string, storeid?: string, agentid?: string }, context?: Context) {
        let result = '';
        let con = context.for(Container).create();
        if (req.id) {
            con = await context.for(Container).findId(req.id);
            if (!con) {
                return 'Id Not Found';
            }
        }
        con.name.value = req.name;
        con.sid.value = req.storeid;
        con.aid.value = req.agentid;
        await con.save();
        result = con.id.value;
        return result;
    }
}

export class ContainerIdColumn extends LookupColumn<Container> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(Container), {
            displayValue: () => this.item.name.value
            , ...settings
        });
        extend(this).dataControl(dcs => {
            dcs.hideDataOnInput = true;
            dcs.clickIcon = 'search';
            dcs.getValue = () => this.displayValue;
            dcs.click = async () => {
                await openDialog(DynamicServerSideSearchDialogComponent,
                    dlg => dlg.args(Container, {
                        onClear: () => this.value = '',
                        onSelect: cur => this.value = cur.id.value,
                        searchColumn: cur => new StringColumn({ defaultValue: cur.name.value.toString() })
                    }));
            };
        });
    }
}
