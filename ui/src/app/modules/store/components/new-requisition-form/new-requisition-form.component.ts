import { Component, Inject, Input, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Dropdown } from "src/app/shared/modules/form/models/dropdown.model";
import { Field } from "src/app/shared/modules/form/models/field.model";
import { FormValue } from "src/app/shared/modules/form/models/form-value.model";
import { Textbox } from "src/app/shared/modules/form/models/text-box.model";
import { RequisitionInput } from "src/app/shared/resources/store/models/requisition-input.model";
import { keyBy } from "lodash";
import { Observable } from "rxjs";
import { StockService } from "src/app/shared/resources/store/services/stock.service";
import { RequisitionService } from "src/app/shared/resources/store/services/requisition.service";
import { ConfigsService } from "src/app/shared/services/configs.service";

@Component({
  selector: "app-new-requisition-form",
  templateUrl: "./new-requisition-form.component.html",
  styleUrls: ["./new-requisition-form.component.scss"],
})
export class NewRequisitionFormComponent implements OnInit {
  @Input() currentStore: any;
  @Input() referenceTagsThatCanRequestFromPharmacyConfigs: any;
  @Input() referenceTagsThatCanRequestFromMainStoreConfigs: any;
  @Input() mainStoreLocationTagUuid: any;
  @Input() pharmacyLocationTagUuid: any;
  @Input() stores: any;
  @Input() codeFormatSetting: any;

  requisitionFields: Field<string>[];
  quantityField: Field<string>[];
  requisitionFormValue: FormValue;
  currentLocationTagsUuids: any = {};
  stockStatusForSelectedStore$: Observable<any>;
  specifiedQuantity: number;
  formData: any = {};
  targetStoreField: Dropdown[];
  storeUuid: string;
  itemUuid: string;
  requisitionObject: any;
  addingRequisitions: boolean = false;
  requisition: any;
  constructor(
    private stockService: StockService,
    private requisitionService: RequisitionService,
    private configService: ConfigsService
  ) {}

  ngOnInit() {
    const keyedMainStoreRequestEligibleTags = keyBy(
      this.referenceTagsThatCanRequestFromMainStoreConfigs,
      "value"
    );
    const keyedPharmacyRequestEligibleTags = keyBy(
      this.referenceTagsThatCanRequestFromPharmacyConfigs,
      "value"
    );
    const canRequestFromMainStore =
      (
        this.currentStore?.tags?.filter(
          (tag) => keyedMainStoreRequestEligibleTags[tag?.uuid]
        ) || []
      )?.length > 0;
    const canRequestFromPharmacy =
      (
        this.currentStore?.tags?.filter(
          (tag) => keyedPharmacyRequestEligibleTags[tag?.uuid]
        ) || []
      )?.length > 0;
    this.targetStoreField = [
      new Dropdown({
        id: "targetStore",
        key: "targetStore",
        label: "Target Store",
        required: true,
        options: (this.stores || [])
          .map((store) => {
            if (
              store?.uuid !== this.currentStore?.uuid &&
              ((canRequestFromMainStore &&
                (
                  store?.tags?.filter(
                    (tag) => tag?.uuid === this.mainStoreLocationTagUuid
                  ) || []
                )?.length > 0) ||
                (!canRequestFromPharmacy &&
                  (
                    store?.tags?.filter(
                      (tag) => tag?.uuid === this.pharmacyLocationTagUuid
                    ) || []
                  )?.length > 0) ||
                (canRequestFromMainStore &&
                  (
                    store?.tags?.filter(
                      (tag) => tag?.uuid === this.mainStoreLocationTagUuid
                    ) || []
                  )?.length === 0 &&
                  (
                    store?.tags?.filter(
                      (tag) => keyedPharmacyRequestEligibleTags[tag?.uuid]
                    ) || []
                  )?.length > 0))
            ) {
              return {
                key: store.id,
                value: store.id,
                label: store.name,
              };
            }
          })
          ?.filter((storeLocation) => storeLocation),
      }),
    ];
    this.requisitionFields = [
      new Dropdown({
        id: "requisitionItem",
        key: "requisitionItem",
        label: "Item",
        required: true,
        options: [],
        shouldHaveLiveSearchForDropDownFields: true,
        searchControlType: "billableItem",
      }),
    ];
    this.quantityField = [
      new Textbox({
        id: "quantity",
        key: "quantity",
        label: "Quantity",
        min: 1,
        required: true,
        type: "number",
      }),
    ];
  }

  onRequest(e: Event) {
    e.stopPropagation();
    this.requisitionObject = {
      requestingLocationUuid: this.currentStore?.id,
      requestedLocationUuid: this.formData?.targetStore?.value,
      items: [
        {
          itemUuid: this.formData?.requisitionItem?.value,
          quantity: parseInt(this.formData?.quantity.value, 10),
        },
      ],
    };

    this.requisitionService
      .createRequest(this.requisitionObject)
      .subscribe((response) => {
        if (response) {
          console.log("==> Response: ", response);
        }
      });
  }

  onAdd(e) {
    if (this.requisition) {
      const item = {
        item: {
          uuid: this.formData?.requisitionItem?.value,
        },
        quantity: parseInt(this.formData?.quantity.value, 10),
        requisition: {
          uuid: this.requisition?.uuid,
        },
        requisitionItemStatus: [
          {
            status: "DRAFT",
          },
        ],
      };
      this.requisitionService
        .createRequisitionItem(item)
        .subscribe((response) => {
          if (!response?.error) {
            const storedRequisition = this.requisition;
            this.requisition = undefined;
            setTimeout(() => {
              this.requisition = storedRequisition;
            }, 100);
          }
        });
    } else {
      // // if (
      // //   this.formData?.quantity?.value ===
      // //   this.requisitionObject?.requestedLocationUuid
      // // ) {
      // //   this.requisitionObject = {
      // //     ...this.requisitionObject,
      // //     requestingLocationUuid: this.currentStore?.id,
      // //     requestedLocationUuid: this.storeUuid,
      // //     items: this.requisitionObject?.items?.length
      // //       ? [
      // //           ...this.requisitionObject?.items,
      // //           {
      // //             itemUuid: this.formData?.requisitionItem?.value,
      // //             quantity: parseInt(
      // //               String(this.formData?.quantity?.value),
      // //               10
      // //             ),
      // //           },
      // //         ]
      // //       : [
      // //           {
      // //             itemUuid: this.formData?.requisitionItem?.value,
      // //             quantity: parseInt(
      // //               String(this.formData?.quantity?.value),
      // //               10
      // //             ),
      // //           },
      // //         ],
      // //   };
      // } else {
      // }
      this.requisitionObject = {
        requestingLocationUuid: this.currentStore?.id,
        requestedLocationUuid: this.formData?.targetStore?.value,
        requisitionStatuses: [
          {
            status: "DRAFT",
          },
        ],
        requisitionItems: [
          {
            item: {
              uuid: this.formData?.requisitionItem?.value,
            },
            quantity: parseInt(this.formData?.quantity.value, 10),
            requisitionItemStatus: [
              {
                status: "DRAFT",
              },
            ],
          },
        ],
      };

      this.configService
        .generateCode(this.codeFormatSetting?.uuid, "requisition", 1, 5)
        .subscribe((response) => {
          if (!response?.error) {
            const requisitionObject = {
              ...this.requisitionObject,
              code: response[0] ? response[0] : "",
            };
            this.requisitionService
              .createRequisition(requisitionObject)
              .subscribe((response) => {
                if (!response?.error) {
                  this.requisition = response;
                }
              });
          }
        });
    }
  }

  onUpdateForm(formValue: FormValue): void {
    this.requisitionFormValue = formValue;
    this.formData = {
      ...this.formData,
      ...this.requisitionFormValue.getValues(),
    };
    this.storeUuid = formValue.getValues()?.targetStore?.value;
    this.itemUuid = formValue.getValues()?.requisitionItem?.value;
    this.specifiedQuantity = Number(formValue.getValues()?.quantity?.value);
    if (this.itemUuid && this.storeUuid) {
      this.stockStatusForSelectedStore$ =
        this.stockService.getAvailableStockOfAnItem(
          this.itemUuid,
          this.storeUuid
        );
    }
  }
}