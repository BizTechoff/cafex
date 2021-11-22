import { checkForDuplicateValue, Context, EntityClass, IdEntity, StringColumn } from "@remult/core";
import { Roles } from "../../users/roles";
import { UserId } from "../../users/users";

@EntityClass
export class Container extends IdEntity {

    name = new StringColumn({ caption: 'שם' });
    sid = new UserId(this.context, Roles.store, { caption: "בית קפה" });
    aid = new UserId(this.context, Roles.agent, { caption: "סוכן" });

    constructor(private context: Context) {
        super({
            name: 'containers',
            allowApiCRUD: true,
            allowApiRead: c => c.isSignedIn(),
            saving: async () => {
                if (context.onServer) {
                    await checkForDuplicateValue(this, this.name, this.context.for(Container));
                }
            }
        });
    }
}
