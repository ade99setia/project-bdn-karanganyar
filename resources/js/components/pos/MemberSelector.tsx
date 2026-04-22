import { useState } from 'react';
import { Search, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';

interface Member {
    id: number;
    name: string;
    member_number: string;
    phone: string;
    membershipTier: {
        name: string;
        default_discount_percentage: number;
    };
}

interface MemberSelectorProps {
    selectedMember: Member | null;
    onSelectMember: (member: Member | null) => void;
}

export default function MemberSelector({ selectedMember, onSelectMember }: MemberSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Member[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await axios.get('/settings/membership/members/search', {
                params: { query: searchQuery }
            });
            setSearchResults(response.data);
            setShowResults(true);
        } catch (err) {
            console.error('Failed to search members', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectMember = (member: Member) => {
        onSelectMember(member);
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
    };

    const handleRemoveMember = () => {
        onSelectMember(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm">Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {selectedMember ? (
                    <div className="p-3 border rounded bg-green-50 dark:bg-green-900/20">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-sm">{selectedMember.name}</span>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleRemoveMember}
                                className="h-6 w-6 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <p>No. Member: {selectedMember.member_number}</p>
                            <p>Tier: {selectedMember.membershipTier.name}</p>
                            <p className="text-green-600 font-medium">
                                Diskon: {selectedMember.membershipTier.default_discount_percentage}%
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Cari member (nama/no/telp)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="text-sm"
                            />
                            <Button
                                size="sm"
                                onClick={handleSearch}
                                disabled={isSearching}
                            >
                                <Search className="w-4 h-4" />
                            </Button>
                        </div>

                        {showResults && (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {searchResults.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-2">
                                        Member tidak ditemukan
                                    </p>
                                ) : (
                                    searchResults.map((member) => (
                                        <div
                                            key={member.id}
                                            className="p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-sm"
                                            onClick={() => handleSelectMember(member)}
                                        >
                                            <p className="font-medium">{member.name}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {member.member_number} | {member.membershipTier.name}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
