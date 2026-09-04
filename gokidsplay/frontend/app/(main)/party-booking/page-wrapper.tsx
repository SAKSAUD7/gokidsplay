import React from 'react';
import { getPartyPackages } from "../../actions/party-packages";
import PartyBookingContent from "./components/PartyBookingContent";

export const dynamic = 'force-dynamic';

export default async function PartyBookingPage() {
    // Fetch party packages
    const packages = await getPartyPackages() as any[];

    // Get the first active package (or you can filter by specific criteria)
    const activePackage = packages.find(pkg => pkg.active) || packages[0];

    return (
        <PartyBookingContent partyPackage={activePackage} />
    );
}
