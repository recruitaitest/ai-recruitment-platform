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
import OfferTemplateSection from "./OfferTemplateSection";
import OfferFilters from "./OfferFilters";
import OfferTable, { Offer } from "./OfferTable";
import ViewOfferModal from "./ViewOfferModal";
import CreateOfferModal from "./CreateOfferModal";
import EditOfferModal from "./EditOfferModal";
import SendOfferModal from "./SendOfferModal";

export default function OfferLayout() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = await getOffers();
      setOffers(data || []);
      setFilteredOffers(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load offers.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (offerId: number, status: string) => {
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

      {/* Offer Template Section (Above Search Bar) */}
      <OfferTemplateSection />

      {/* Search & Filter Bar */}
      <OfferFilters offers={offers} onFilterChange={setFilteredOffers} />

      {/* Main Table */}
      <OfferTable
        loading={loading}
        offers={filteredOffers}
        onGenerate={(offer) => {
          setSelectedOffer(offer);
          setGenerateOpen(true);
        }}
        onView={(offer) => {
          setSelectedOffer(offer);
          setViewOpen(true);
        }}
        onEdit={(offer) => {
          setSelectedOffer(offer);
          setEditOpen(true);
        }}
        onSend={(offer) => {
          setSelectedOffer(offer);
          setSendOpen(true);
        }}
        onDelete={handleDelete}
        onStatusChange={handleStatusUpdate}
        onRefresh={loadOffers}
      />

      {/* Generate Offer Modal */}
      {generateOpen && selectedOffer && (
        <CreateOfferModal
          open={generateOpen}
          onClose={() => {
            setGenerateOpen(false);
            setSelectedOffer(null);
          }}
          candidateId={selectedOffer.candidate_id}
          candidateName={selectedOffer.candidate_name}
          positionId={selectedOffer.position_id}
          positionTitle={selectedOffer.position_title}
          pipelineId={selectedOffer.pipeline_id}
          onOfferCreated={loadOffers}
        />
      )}

      {/* View Offer / Interactive PDF Preview Modal */}
      {viewOpen && selectedOffer?.id && (
        <ViewOfferModal
          open={viewOpen}
          onClose={() => {
            setViewOpen(false);
            setSelectedOffer(null);
          }}
          offerId={selectedOffer.id}
          onOfferSent={loadOffers}
          onEdit={(off) => {
            setSelectedOffer(off);
            setEditOpen(true);
          }}
        />
      )}

      {/* Edit Offer Modal */}
      {editOpen && selectedOffer?.id && (
        <EditOfferModal
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            setSelectedOffer(null);
          }}
          offerId={selectedOffer.id}
          onOfferUpdated={loadOffers}
        />
      )}

      {/* Send Offer Modal */}
      {sendOpen && selectedOffer?.id && (
        <SendOfferModal
          open={sendOpen}
          onClose={() => {
            setSendOpen(false);
            setSelectedOffer(null);
          }}
          offerId={selectedOffer.id}
          candidateName={selectedOffer.candidate_name}
          onOfferSent={loadOffers}
        />
      )}
    </div>
  );
}