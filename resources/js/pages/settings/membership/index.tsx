import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import axios from 'axios';

interface MembershipTier {
    id: number;
    name: string;
    default_discount_percentage: number;
    description?: string;
}

interface Member {
    id: number;
    name: string;
    member_number: string;
    phone: string;
    email?: string;
    status: string;
    membershipTier: {
        name: string;
    };
}

interface ProductDiscount {
    id: number;
    membershipTier: {
        name: string;
    };
    product: {
        name: string;
        sku: string;
    };
    discount_percentage: number;
}

interface Props {
    tiers: MembershipTier[];
    members: Member[];
    productDiscounts: ProductDiscount[];
}

export default function MembershipIndex({ tiers: initialTiers = [], members: initialMembers = [], productDiscounts: initialDiscounts = [] }: Props) {
    const [tiers, setTiers] = useState(initialTiers || []);
    const [members, setMembers] = useState(initialMembers || []);
    const [productDiscounts, setProductDiscounts] = useState(initialDiscounts || []);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Tier Management
    const [showTierForm, setShowTierForm] = useState(false);
    const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
    const [tierForm, setTierForm] = useState({
        name: '',
        default_discount_percentage: '',
        description: ''
    });

    const handleSaveTier = async () => {
        try {
            if (editingTier) {
                await axios.put(`/settings/membership/tiers/${editingTier.id}`, tierForm);
                setSuccess('Tier berhasil diupdate');
            } else {
                await axios.post('/settings/membership/tiers', tierForm);
                setSuccess('Tier berhasil dibuat');
            }
            
            router.reload();
            setShowTierForm(false);
            setEditingTier(null);
            setTierForm({ name: '', default_discount_percentage: '', description: '' });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menyimpan tier');
        }
    };

    const handleDeleteTier = async (id: number) => {
        if (!confirm('Yakin ingin menghapus tier ini?')) return;

        try {
            await axios.delete(`/settings/membership/tiers/${id}`);
            setSuccess('Tier berhasil dihapus');
            router.reload();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menghapus tier');
        }
    };

    // Member Management
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [memberForm, setMemberForm] = useState({
        name: '',
        member_number: '',
        phone: '',
        email: '',
        membership_tier_id: ''
    });

    const handleSaveMember = async () => {
        try {
            if (editingMember) {
                await axios.put(`/settings/membership/members/${editingMember.id}`, memberForm);
                setSuccess('Member berhasil diupdate');
            } else {
                await axios.post('/settings/membership/members', memberForm);
                setSuccess('Member berhasil dibuat');
            }
            
            router.reload();
            setShowMemberForm(false);
            setEditingMember(null);
            setMemberForm({ name: '', member_number: '', phone: '', email: '', membership_tier_id: '' });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menyimpan member');
        }
    };

    const handleDeleteMember = async (id: number) => {
        if (!confirm('Yakin ingin menonaktifkan member ini?')) return;

        try {
            await axios.delete(`/settings/membership/members/${id}`);
            setSuccess('Member berhasil dinonaktifkan');
            router.reload();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menonaktifkan member');
        }
    };

    return (
        <AppLayout>
            <Head title="Membership Management" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">Membership Management</h1>
                        <p className="text-sm text-gray-600">Kelola tier membership, member, dan diskon produk</p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-4">
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    <Tabs defaultValue="tiers" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="tiers">Membership Tiers</TabsTrigger>
                            <TabsTrigger value="members">Members</TabsTrigger>
                            <TabsTrigger value="discounts">Product Discounts</TabsTrigger>
                        </TabsList>

                        {/* Tiers Tab */}
                        <TabsContent value="tiers">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Membership Tiers</CardTitle>
                                        <Button onClick={() => {
                                            setShowTierForm(true);
                                            setEditingTier(null);
                                            setTierForm({ name: '', default_discount_percentage: '', description: '' });
                                        }}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah Tier
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {showTierForm && (
                                        <div className="mb-4 p-4 border rounded space-y-3">
                                            <h3 className="font-medium">
                                                {editingTier ? 'Edit Tier' : 'Tambah Tier Baru'}
                                            </h3>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Nama Tier</label>
                                                <Input
                                                    value={tierForm.name}
                                                    onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                                                    placeholder="Bronze, Silver, Gold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Diskon Default (%)</label>
                                                <Input
                                                    type="number"
                                                    value={tierForm.default_discount_percentage}
                                                    onChange={(e) => setTierForm({ ...tierForm, default_discount_percentage: e.target.value })}
                                                    placeholder="5"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
                                                <Input
                                                    value={tierForm.description}
                                                    onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })}
                                                    placeholder="Deskripsi tier"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button onClick={handleSaveTier}>Simpan</Button>
                                                <Button variant="outline" onClick={() => {
                                                    setShowTierForm(false);
                                                    setEditingTier(null);
                                                }}>
                                                    Batal
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {tiers && tiers.length > 0 ? (
                                            tiers.map((tier) => (
                                                <div key={tier.id} className="flex justify-between items-center p-3 border rounded">
                                                    <div>
                                                        <p className="font-medium">{tier.name}</p>
                                                        <p className="text-sm text-gray-600">
                                                            Diskon: {tier.default_discount_percentage}%
                                                        </p>
                                                        {tier.description && (
                                                            <p className="text-xs text-gray-500">{tier.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingTier(tier);
                                                                setTierForm({
                                                                    name: tier.name,
                                                                    default_discount_percentage: tier.default_discount_percentage.toString(),
                                                                    description: tier.description || ''
                                                                });
                                                                setShowTierForm(true);
                                                            }}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteTier(tier.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">Belum ada tier membership</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Members Tab */}
                        <TabsContent value="members">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Members</CardTitle>
                                        <Button onClick={() => {
                                            setShowMemberForm(true);
                                            setEditingMember(null);
                                            setMemberForm({ name: '', member_number: '', phone: '', email: '', membership_tier_id: '' });
                                        }}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah Member
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {showMemberForm && (
                                        <div className="mb-4 p-4 border rounded space-y-3">
                                            <h3 className="font-medium">
                                                {editingMember ? 'Edit Member' : 'Tambah Member Baru'}
                                            </h3>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Nama</label>
                                                <Input
                                                    value={memberForm.name}
                                                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">No. Member</label>
                                                <Input
                                                    value={memberForm.member_number}
                                                    onChange={(e) => setMemberForm({ ...memberForm, member_number: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Telepon</label>
                                                <Input
                                                    value={memberForm.phone}
                                                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Email (Opsional)</label>
                                                <Input
                                                    type="email"
                                                    value={memberForm.email}
                                                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Tier</label>
                                                <select
                                                    className="w-full border rounded px-3 py-2"
                                                    value={memberForm.membership_tier_id}
                                                    onChange={(e) => setMemberForm({ ...memberForm, membership_tier_id: e.target.value })}
                                                >
                                                    <option value="">Pilih Tier</option>
                                                    {tiers.map((tier) => (
                                                        <option key={tier.id} value={tier.id}>
                                                            {tier.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button onClick={handleSaveMember}>Simpan</Button>
                                                <Button variant="outline" onClick={() => {
                                                    setShowMemberForm(false);
                                                    setEditingMember(null);
                                                }}>
                                                    Batal
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {members && members.length > 0 ? (
                                            members.map((member) => (
                                                <div key={member.id} className="flex justify-between items-center p-3 border rounded">
                                                    <div>
                                                        <p className="font-medium">{member.name}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {member.member_number} | {member.phone}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Tier: {member.membershipTier?.name || 'N/A'} | Status: {member.status}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingMember(member);
                                                                setMemberForm({
                                                                    name: member.name,
                                                                    member_number: member.member_number,
                                                                    phone: member.phone,
                                                                    email: member.email || '',
                                                                    membership_tier_id: ''
                                                                });
                                                                setShowMemberForm(true);
                                                            }}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteMember(member.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">Belum ada member</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Product Discounts Tab */}
                        <TabsContent value="discounts">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Product Discounts</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Diskon khusus untuk produk tertentu per tier membership
                                    </p>
                                    <div className="space-y-2">
                                        {productDiscounts && productDiscounts.length > 0 ? (
                                            productDiscounts.map((discount) => (
                                                <div key={discount.id} className="flex justify-between items-center p-3 border rounded">
                                                    <div>
                                                        <p className="font-medium">{discount.product?.name || 'N/A'}</p>
                                                        <p className="text-sm text-gray-600">
                                                            SKU: {discount.product?.sku || 'N/A'} | Tier: {discount.membershipTier?.name || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-green-600">
                                                            Diskon: {discount.discount_percentage}%
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={async () => {
                                                            if (!confirm('Yakin ingin menghapus diskon ini?')) return;
                                                            try {
                                                                await axios.delete(`/settings/membership/product-discounts/${discount.id}`);
                                                                router.reload();
                                                            } catch (err) {
                                                                setError('Gagal menghapus diskon');
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">Belum ada diskon produk khusus</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
