"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    getOffers,
    deleteOffer,
    updateOfferStatus,
} from "@/services/offerService";

import OfferHeader from "./OfferHeader";
import OfferStats from "./OfferStats";
import OfferFilters from "./OfferFilters";
import OfferTable from "./OfferTable";
import OfferDrawer from "./OfferDrawer";
import EditOfferModal from "./EditOfferModal";
import SendOfferModal from "./SendOfferModal";

export default function OfferLayout() {
    const [offers, setOffers] = useState<any[]>([]);
    const [filteredOffers, setFilteredOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedOfferId, setSelectedOfferId] = useState<number | undefined>(undefined);
    const [viewOpen, setViewOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [sendOpen, setSendOpen] = useState(false);

    const loadOffers = async () => {
        try {
            setLoading(true);
            const data = await getOffers();
            setOffers(data);
            setFilteredOffers(data);
        } catch {
            toast.error("Failed to load offers.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (offerId: number, status: string) => {
        if (status === "Send") {
            setSelectedOfferId(offerId);
            setSendOpen(true);
            return;
        }
        try {
            await updateOfferStatus(offerId, status);
            toast.success(`Offer marked as ${status.toLowerCase()}.`);
            loadOffers();
        } catch {
            toast.error("Unable to update offer status.");
        }
    };

    const handleDelete = async (offerId: number) => {
        try {
            await deleteOffer(offerId);
            toast.success("Offer deleted.");
            loadOffers();
        } catch {
            toast.error("Failed to delete offer.");
        }
    };

    useEffect(() => {
        loadOffers();
    }, []);

    return (
        <div className="space-y-6">
            <OfferHeader onRefresh={loadOffers} />

            <OfferStats offers={offers} />

            <OfferFilters
                offers={offers}
                onFilterChange={setFilteredOffers}
            />

            <OfferTable
                loading={loading}
                offers={filteredOffers}
                onStatusChange={handleStatusUpdate}
                onView={(offer) => {
                    setSelectedOfferId(offer.id);
                    setViewOpen(true);
                }}
                onEdit={(offer) => {
                    setSelectedOfferId(offer.id);
                    setEditOpen(true);
                }}
                onDelete={handleDelete}
                onRefresh={loadOffers}
            />

            <OfferDrawer
                open={viewOpen}
                onClose={() => {
                    setViewOpen(false);
                    setSelectedOfferId(undefined);
                }}
                offerId={selectedOfferId}
                onEdit={(id) => {
                    setSelectedOfferId(id);
                    setEditOpen(true);
                }}
                onDelete={handleDelete}
                onRefresh={loadOffers}
            />

            <EditOfferModal
                open={editOpen}
                onClose={() => {
                    setEditOpen(false);
                    setSelectedOfferId(undefined);
                }}
                offerId={selectedOfferId}
                onOfferUpdated={loadOffers}
            />

            <SendOfferModal
                open={sendOpen}
                onClose={() => {
                    setSendOpen(false);
                    setSelectedOfferId(undefined);
                }}
                offerId={selectedOfferId}
                onOfferSent={loadOffers}
            />
        </div>
    );
}