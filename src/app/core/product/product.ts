import { extend, openDialog } from "@remult/angular";
import { BoolColumn, ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, ServerFunction, StringColumn, ValueListColumn, ValueListTypeInfo } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { FILTER_IGNORE, MagicGetProducts, MagicGetProductsResponse } from "../../shared/types";
import { validString } from "../../shared/utils";
import { UserProduct } from "../../users/userProduct/userProduct";
import { Category, CategoryIdColumn } from "../category/category";
import { CategoryItem, CategoryItemIdColumn } from "../category/categoryItem";


export class ProductSharing {
    static public = new ProductSharing('כללי');
    static private = new ProductSharing('משוייך');
    constructor(caption = '') { this.caption = caption; }
    id: string;
    caption: string;
    isPrivate() { return this === ProductSharing.private; }
    isPublic() { return this === ProductSharing.public; }
}
export class ProductSharingColumn extends ValueListColumn<ProductSharing> {
    constructor(options?: ColumnSettings<ProductSharing>) {
        super(ProductSharing, {
            caption: 'שיתוף',
            defaultValue: ProductSharing.private,
            ...options
        });
    }
    isPrivate() { return this.value && this.value.isPrivate(); }
    isPublic() { return this.value && this.value.isPublic(); }
}


export class ProductType {
    static regular = new ProductType('רגיל');
    static technical = new ProductType('תחזוקה');
    constructor(caption = '') { this.caption = caption; }
    id: string;
    caption: string;
    isRegular() { return this === ProductType.regular; }
    isTechnical() { return this === ProductType.technical; }
}
export class ProductTypeColumn extends ValueListColumn<ProductType> {
    constructor(options?: ColumnSettings<ProductType>) {
        super(ProductType, {
            caption: 'סוג',
            defaultValue: ProductType.regular,
            ...options
        });
    }
    isRegular() { return this.value && this.value.isRegular(); }
    isTechnical() { return this.value && this.value.isTechnical(); }
}

// export class ProductStatus {
//     static public = new ProductStatus('פעיל');
//     static private = new ProductStatus('לא פעיל');
//     constructor(caption = '') { this.caption = caption; }
//     id: string;
//     caption: string;
//     isPrivate() { return this === ProductStatus.private; }
//     isPublic() { return this === ProductStatus.public; }
// }
// export class ProductStatusColumn extends ValueListColumn<ProductStatus> {
//     constructor(options?: ColumnSettings<ProductStatus>) {
//         super(ProductStatus, {
//             caption: 'סוג',
//             defaultValue: ProductStatus.private,
//             ...options
//         });
//     }
//     isPrivate() { return this.value && this.value.isPrivate(); }
//     isPublic() { return this.value && this.value.isPublic(); }
// }


@EntityClass
export class Product extends IdEntity {
    type = extend(new ProductTypeColumn()).dataControl(x => {
        let v = [] as ProductType[];
        for (const t of ValueListTypeInfo.get(ProductType).getOptions()) {
                v.push(t);
        }
        // v.sort((a,b) => a.caption.localeCompare(b.caption));
        x.valueList = v;
    });
    cid = extend(new CategoryIdColumn(this.context, {
        caption: 'קבוצה ראשית',
        validate: () => {
            validString(this.cid, { notNull: true, minLength: 3 });
        }
    })).dataControl(it => {
        it.hideDataOnInput = true;
        it.clickIcon = 'search';
        it.getValue = () => this.cid.displayValue;
        it.click = async () => {
            await openDialog(DynamicServerSideSearchDialogComponent,
                dlg => dlg.args(Category, {
                    onClear: () => this.cid.value = '',
                    onSelect: cur => {
                        this.cid.value = cur.id.value;
                        this.ciid.value = '';
                    },
                    searchColumn: cur => cur.name
                })
            );
        };
    });
    ciid = extend(new CategoryItemIdColumn(this.context, {
        caption: 'קבוצה משנית',
        validate: () => {
            validString(this.ciid, { notNull: true, minLength: 3 });
        }
    })).dataControl(it => {
        // it.readOnly = this.cid.value && this.cid.value.length > 0 ? false : true;
        it.hideDataOnInput = true;
        it.clickIcon = 'search';
        it.getValue = () => this.ciid.displayValue;
        it.click = async () => {
            await openDialog(DynamicServerSideSearchDialogComponent,
                dlg => dlg.args(CategoryItem, {
                    onClear: () => this.ciid.value = '',
                    onSelect: cur => this.ciid.value = cur.id.value,
                    searchColumn: cur => cur.name,
                    where: (cur) => cur.cid.isEqualTo(this.cid)
                })
            );
        };
    });
    sku = new StringColumn({
        caption: 'מק"ט',
        validate: () => {
            validString(this.sku, { notNull: true, minLength: 3 });
        }
    });
    name = new StringColumn({
        caption: 'שם',
        validate: () => {
            validString(this.name, { notNull: true, minLength: 3 });
        }
    });
    share = extend(new ProductSharingColumn()).dataControl(x => {
        let v = [] as ProductSharing[];
        for (const t of ValueListTypeInfo.get(ProductSharing).getOptions()) {
                v.push(t);
        }
        // v.sort((a,b) => a.caption.localeCompare(b.caption));
        x.valueList = v;
    });
    active = new BoolColumn({ caption: 'פעיל', defaultValue: true });
    count: number;

    getKey() {
        // return
    }

    getCount() {
        if (this.count !== undefined)
            return this.count;
        this.count = 0;
        this.context.for(UserProduct).count(c => c.pid.isEqualTo(this.id)).then(result => { this.count = result; })
        return this.count;
    }

    constructor(private context: Context) {
        super({
            caption: 'פריט',
            name: 'products',
            allowApiCRUD: c => c.isSignedIn(),
            allowApiRead: c => c.isSignedIn()
        });
    }

    @ServerFunction({ allowed: true })
    static async getProducts(req: MagicGetProducts, context?: Context) {
        let r: MagicGetProductsResponse[] = [];
        for await (const c of context.for(Product).iterate({
            where: row => {
                let result = FILTER_IGNORE;
                if (req.id) {
                    result = result.and(row.id.isEqualTo(req.id));
                }
                else {
                    if (req.main) {
                        result = result.and(row.cid.isEqualTo(req.main));
                    }
                    if (req.sub) {
                        result = result.and(row.ciid.isEqualTo(req.sub));
                    }
                    if (req.sku) {
                        result = result.and(row.sku.isEqualTo(req.sku));
                    }
                }
                return result;
            }
        })) {
            r.push({
                id: c.id.value,
                name: c.name.value,
                main: c.cid.value,
                sub: c.ciid.value,
                sku: c.sku.value
            });
        }
        return r;
    }
};

export class ProductIdColumn extends LookupColumn<Product> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(Product), {
            caption: 'פריט',
            displayValue: () => this.item.name.value
            , ...settings
        });
        extend(this).dataControl(it => {
            // dcs.width = '400';
            it.hideDataOnInput = true;
            it.clickIcon = 'search';
            it.getValue = () => this.displayValue;
            it.click = async () => {
                await openDialog(DynamicServerSideSearchDialogComponent,
                    it => it.args(Product, {
                        onClear: () => this.value = '',
                        onSelect: cur => this.value = cur.id.value,
                        searchColumn: cur => cur.name
                    })
                );
            };
        });
    }
}
