import { Context, EntityClass, IdEntity, NumberColumn } from "@remult/core";
import { validString } from "../../shared/utils";
import { Roles } from "../../users/roles";
import { ProductIdColumn } from "../product/product";
import { CeritificateIdColumn } from "./certificate";

@EntityClass
export class CeritificateItem extends IdEntity {
    cid = new CeritificateIdColumn(this.context,{caption: 'תעודה'});
    pid = new ProductIdColumn(this.context, {
        caption: 'מוצר',
        validate: () => {
            if (!validString(this.pid, { notNull: true, minLength: 2 })) {
                throw this.pid.defs.caption + ': ' + this.pid.validationError;
            }
        }
    }); 
    quantity = new NumberColumn({caption: 'כמות', decimalDigits: 2});
    quantitySent = new NumberColumn({caption: 'כמות שסופקה', decimalDigits: 2});
    quantityLeft = new NumberColumn({caption: 'כמות שנותרה', decimalDigits: 2});
    priceSale= new NumberColumn({caption: 'מחיר מכירה',decimalDigits: 2});
    priceBeforeDiscount= new NumberColumn({caption: 'סה"כ לפני',decimalDigits: 2});
    discountPcnt = new NumberColumn({caption: 'אחוז הנחה',decimalDigits: 2});
    discount = new NumberColumn({caption: 'סכום הנחה',decimalDigits: 2});
    priceAfterDiscount= new NumberColumn({caption: 'סה"כ לשורה',decimalDigits: 2});

    constructor(private context: Context) {
        super({
            name: 'certificatesItems',
            allowApiCRUD: [Roles.admin, Roles.technician],
            allowApiRead: c => c.isSignedIn()
        });
    }
}
