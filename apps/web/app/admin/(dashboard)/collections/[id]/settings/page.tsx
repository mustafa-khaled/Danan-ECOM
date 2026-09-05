"use client";

import { Switch } from "@/components/ui";
import {
  MembershipPermissionsTable,
  RolesPermissionsTable,
} from "@/features/admin/collections";

export default function CollectionSettings() {
  return (
    <div>
      <div className="my-[32px] py-[32px] border-b border-t border-[#E1E4E8]">
        <div>
          <h4 className="font-heading mb-5 text-h4 font-bold">General</h4>

          <form>
            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="houseName"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  House Name
                </label>
                <input
                  type="text"
                  name="houseName"
                  placeholder="Enter house name"
                  id="houseName"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="houseDescription"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  House Description
                </label>
                <input
                  type="text"
                  name="houseDescription"
                  placeholder="Enter house description"
                  id="houseDescription"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="contactEmail"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Contact Email
                </label>
                <input
                  type="text"
                  name="contactEmail"
                  placeholder="Enter contact email"
                  id="contactEmail"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="supportContact"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Support Contact
                </label>
                <input
                  type="text"
                  name="supportContact"
                  placeholder="Enter support contact"
                  id="supportContact"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 w-full mt-[16px]">
              <button className="w-24 h-11 border border-[#EAE7E4] rounded-lg text-[14px] font-medium text-[#141210]">
                Edit
              </button>
              <button className="w-24 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="py-[32px] border-b border-[#E1E4E8]">
        <h4 className="font-heading mb-5 text-h4 font-bold">House Access</h4>

        <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
          <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
            <span className="text-h6 text-[#5D697A]">
              Enter Your Access Key
            </span>
            <Switch
              id="accessKeyToggle"
              variant="success"
              defaultChecked={true}
              aria-label="Enter Your Access Key"
            />
          </div>
          <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
            <span className="text-h6 text-[#5D697A]">Require Private Key</span>
            <Switch
              id="privateKeyToggle"
              variant="success"
              defaultChecked={true}
              aria-label="Require Private Key"
            />
          </div>
          <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
            <span className="text-h6 text-[#5D697A]">Admin Approval</span>
            <Switch
              id="adminApprovalToggle"
              variant="success"
              defaultChecked={true}
              aria-label="Admin Approval"
            />
          </div>
          <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
            <span className="text-h6 text-[#5D697A]">Allow Invitations</span>
            <Switch
              id="allowInvitations"
              variant="success"
              defaultChecked={true}
              aria-label="Allow Invitations"
            />
          </div>
        </div>
      </div>

      <MembershipPermissionsTable />

      <RolesPermissionsTable />
    </div>
  );
}

