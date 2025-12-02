import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import partnersService from '../services/partnersService';
import usersService from '../services/usersService';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Edit,
  DollarSign,
  CheckCircle,
  Clock,
  Users,
  Percent,
  TrendingUp,
  Phone,
  Mail,
} from 'lucide-react';

export default function AdminPartnersPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState('');
  const [slotsToAdd, setSlotsToAdd] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'ADMIN') {
      toast.error('This page is only accessible to administrators');
      navigate('/');
      return;
    }

    loadPartners();
  }, [isAuthenticated, user, navigate]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await partnersService.findAll();
      setPartners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load partners:', err);
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommission = async (partnerId) => {
    const rate = parseFloat(newCommissionRate);
    if (isNaN(rate) || rate < 0 || rate > 0.5) {
      toast.error('Commission rate must be between 0% and 50%');
      return;
    }

    try {
      await partnersService.updateCommissionRate(partnerId, rate);
      toast.success('Commission rate updated successfully');
      setShowEditModal(false);
      setNewCommissionRate('');
      await loadPartners();
    } catch (err) {
      toast.error(err.message || 'Failed to update commission rate');
    }
  };

  const handleAddSlots = async (partnerId) => {
    const slots = parseInt(slotsToAdd);
    if (isNaN(slots) || slots < 1) {
      toast.error('Number of slots must be at least 1');
      return;
    }

    try {
      await partnersService.addPaidSlots(partnerId, slots);
      toast.success(`Added ${slots} paid slot(s) successfully`);
      setSlotsToAdd('');
      await loadPartners();
    } catch (err) {
      toast.error(err.message || 'Failed to add slots');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-1/3"></div>
          <div className="h-64 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            External Partners Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage external partners and their settings
          </p>
        </div>
        <Button onClick={() => toast.info('Partner creation will be available soon')} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader className="pb-2">
            <CardDescription>Total Partners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.length}</div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader className="pb-2">
            <CardDescription>Verified Partners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {partners.filter((p) => p.isVerified).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {formatCurrency(
                partners.reduce((sum, p) => sum + (p.stats?.totalRevenue || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
          <CardHeader className="pb-2">
            <CardDescription>Platform Commission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(
                partners.reduce((sum, p) => sum + (p.stats?.totalCommission || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners List */}
      <div className="space-y-4">
        {partners.length === 0 ? (
          <Card className="border-white/10 bg-white/5 backdrop-blur-lg">
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-xl font-medium">No partners yet</p>
                <p className="text-muted-foreground">
                  External partners will appear here once they're added
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          partners.map((partner) => (
            <Card
              key={partner.id}
              className="border-white/10 bg-white/5 backdrop-blur-lg hover:border-white/20 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle>{partner.companyName}</CardTitle>
                      {partner.isVerified ? (
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 border-green-500/20"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-yellow-500/10 border-yellow-500/20"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      БИН: {partner.bin} • Contact: {partner.contactPerson}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span className="text-muted-foreground">{partner.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span className="text-muted-foreground">{partner.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-blue-400" />
                    <span className="text-muted-foreground">
                      Kaspi: {partner.kaspiPhone}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-3 md:grid-cols-4 p-3 rounded-lg bg-white/5">
                  <div>
                    <div className="text-xs text-muted-foreground">Commission</div>
                    <div className="font-bold text-blue-400">
                      {(partner.commissionRate * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Event Slots</div>
                    <div className="font-bold">
                      1 + {partner.paidEventSlots} paid
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Active Events</div>
                    <div className="font-bold">{partner.stats?.activeEvents || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tickets Sold</div>
                    <div className="font-bold">{partner.stats?.totalTicketsSold || 0}</div>
                  </div>
                </div>

                {/* Financial Stats */}
                <div className="grid gap-3 md:grid-cols-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div>
                    <div className="text-xs text-muted-foreground">Partner Revenue</div>
                    <div className="font-bold text-green-400">
                      {formatCurrency(partner.stats?.totalRevenue || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Platform Commission</div>
                    <div className="font-bold text-blue-400">
                      {formatCurrency(partner.stats?.totalCommission || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Unpaid Commission</div>
                    <div className="font-bold text-amber-400">
                      {formatCurrency(partner.stats?.unpaidCommission || 0)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`commission-${partner.id}`}>Update Commission (%)</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`commission-${partner.id}`}
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        placeholder={(partner.commissionRate * 100).toFixed(1)}
                        value={
                          selectedPartner === partner.id ? newCommissionRate : ''
                        }
                        onChange={(e) => {
                          setSelectedPartner(partner.id);
                          setNewCommissionRate(e.target.value);
                        }}
                      />
                      <Button
                        onClick={() => handleUpdateCommission(partner.id)}
                        disabled={!newCommissionRate || selectedPartner !== partner.id}
                        size="sm"
                      >
                        <Percent className="w-4 h-4 mr-1" />
                        Update
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`slots-${partner.id}`}>Add Event Slots</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`slots-${partner.id}`}
                        type="number"
                        min="1"
                        placeholder="Number of slots"
                        value={selectedPartner === partner.id ? slotsToAdd : ''}
                        onChange={(e) => {
                          setSelectedPartner(partner.id);
                          setSlotsToAdd(e.target.value);
                        }}
                      />
                      <Button
                        onClick={() => handleAddSlots(partner.id)}
                        disabled={!slotsToAdd || selectedPartner !== partner.id}
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
