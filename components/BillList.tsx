import React, { useState, useEffect } from 'react';
import { Table, Loader, Pagination, TextInput, Group, Select, NumberInput, Button, Box, Collapse, Chip, MediaQuery } from "@mantine/core";
import { IBill, Profile } from "../types";
import BillListItem from "./BillListItem";
import { AiOutlineSearch, AiOutlineFilter, AiOutlineClear } from "react-icons/ai";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";
import { FiCalendar } from "react-icons/fi";
import Fuse from 'fuse.js';

interface IBillList {
    adminMode?: boolean; // Indicates whether to fetch all bills (admin) or just user bills
    currentUser: Profile;
}

// Interface for filter state
interface FilterState {
    searchText: string;
    amountMin: number | undefined;
    amountMax: number | undefined;
    dateRange: [Date | null, Date | null];
    post: string;
    name: string;
    unpaid: boolean;
    booked: boolean;
}

export default function BillList({ adminMode = false, currentUser }: IBillList) {
    const [bills, setBills] = useState<IBill[]>([]);
    const [loading, setLoading] = useState(true);
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Advanced search states
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        searchText: '',
        amountMin: undefined,
        amountMax: undefined,
        dateRange: [null, null],
        post: '',
        name: '',
        unpaid: false,
        booked: false,
    });
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [uniquePosts, setUniquePosts] = useState<string[]>([]);

    // Add these state variables for raw input values
    const [startDateInput, setStartDateInput] = useState('');
    const [endDateInput, setEndDateInput] = useState('');

    const isSuperAdmin = currentUser?.admin || false;
    const allowedPost = currentUser?.allowed_posts || "";
    // Function to fetch bills
    const fetchBills = async () => {
        setLoading(true);
        try {
            // Use the admin endpoint if in admin mode, otherwise fetch user's own bills
            const endpoint = adminMode ? '/api/getAllBills' : '/api/getUserBills';
            const response = await fetch(endpoint);

            if (!response.ok) {
                // Handle unauthorized or error responses
                if (response.status === 401 || response.status === 403) {
                    console.error("Access denied");
                } else {
                    console.error("Error fetching bills:", await response.text());
                }
                setBills([]);
            } else {
                let data = await response.json();
                let fetchedBills = data.bills || [];

                // Filter for post-level admins
                let filteredBills = [];
                if (currentUser?.allowed_posts != null) {
                    filteredBills = fetchedBills.filter((bill: IBill) => allowedPost.includes(bill.post));
                } else {
                    filteredBills = fetchedBills;
                }
                setBills(filteredBills);

                // Extract unique values for filter dropdowns
                if (fetchedBills.length > 0) {
                    setUniquePosts(Array.from(new Set(fetchedBills.map((bill: IBill) => bill.post).filter(Boolean))));
                }
            }
        } catch (error) {
            console.error("Error fetching bills:", error);
            setBills([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch bills when component mounts
    useEffect(() => {
        fetchBills();
    }, [adminMode]);

    // Update active filters indicator
    useEffect(() => {
        const active: string[] = [];
        if (filters.searchText) active.push('Text');
        if (filters.amountMin !== undefined || filters.amountMax !== undefined) active.push('Amount');
        if (filters.dateRange[0] || filters.dateRange[1]) active.push('Date');
        if (filters.post) active.push('Post');
        if (filters.name) active.push('Name');
        if (filters.unpaid) active.push('Unpaid');
        setActiveFilters(active);
    }, [filters]);

    // Update the useEffect to initialize the input fields when dates change
    useEffect(() => {
        setStartDateInput(formatDate(filters.dateRange[0]));
        setEndDateInput(formatDate(filters.dateRange[1]));
    }, [filters.dateRange]);

    const toggleUnpaid = () => {
        updateFilter('unpaid', !filters.unpaid);
    };

    // Update a single filter
    const updateFilter = (key: keyof FilterState, value: any) => {
        // Special handling for amount fields
        if ((key === 'amountMin' || key === 'amountMax') && (value === '' || value === null)) {
            // Convert empty string or null to undefined for amount fields
            value = undefined;
        }

        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            searchText: '',
            amountMin: undefined,
            amountMax: undefined,
            dateRange: [null, null],
            post: '',
            name: '',
            unpaid: false,
            booked: false,
        });
        setCurrentPage(1);
    };

    // Fuzzy search with Fuse.js
    const getFuzzySearchResults = (data: IBill[]) => {
        if (!filters.searchText) return data;

        const options = {
            keys: ['activity', 'amount', 'desc', 'iban', 'name', 'post'],
            threshold: 0.4, // Lower means more strict matching
            includeScore: true
        };

        const fuse = new Fuse(data, options);
        const result = fuse.search(filters.searchText);
        return result.map(item => item.item);
    };

    // Apply all filters
    const getFilteredBills = () => {
        let result = [...bills];

        // First apply non-fuzzy filters
        if (filters.unpaid) {
            result = result.filter(bill => !bill.paid);
        }

        if (filters.booked) {
            result = result.filter(bill => bill.booked);
        }

        if (filters.amountMin !== undefined) {
            // Convert euros to cents (multiply by 100)
            const minAmountInCents = filters.amountMin * 100;
            result = result.filter(bill => bill.amount >= minAmountInCents);
        }

        if (filters.amountMax !== undefined) {
            // Convert euros to cents (multiply by 100)
            const maxAmountInCents = filters.amountMax * 100;
            result = result.filter(bill => bill.amount <= maxAmountInCents);
        }

        if (filters.dateRange[0]) {
            const startDate = filters.dateRange[0];
            result = result.filter(bill => {
                if (!bill.date) return false;
                const billDate = new Date(bill.date);
                return billDate >= startDate;
            });
        }

        if (filters.dateRange[1]) {
            const endDate = filters.dateRange[1];
            result = result.filter(bill => {
                if (!bill.date) return false;
                const billDate = new Date(bill.date);
                return billDate <= endDate;
            });
        }

        if (filters.post) {
            result = result.filter(bill => bill.post === filters.post);
        }

        if (filters.name) {
            result = result.filter(bill =>
                bill.name.toLowerCase().includes(filters.name.toLowerCase()));
        }

        // Apply fuzzy search last
        if (filters.searchText) {
            result = getFuzzySearchResults(result);
        }

        return result;
    };

    const filteredBills = getFilteredBills();

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBills = filteredBills.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

    // Function to handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Function to handle when a bill is deleted
    const handleBillDeleted = () => {
        fetchBills();
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const parseDate = (dateString: string): Date | null => {
        if (!dateString) return null;
        if (!dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return null;

        const [day, month, year] = dateString.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? null : date;
    };

    if (loading && bills.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    const clearSingleFilter = (filterType: string) => {
        switch (filterType) {
            case 'Text':
                updateFilter('searchText', '');
                break;
            case 'Amount':
                updateFilter('amountMin', undefined);
                updateFilter('amountMax', undefined);
                break;
            case 'Date':
                updateFilter('dateRange', [null, null]);
                break;
            case 'Post':
                updateFilter('post', '');
                break;
            case 'Name':
                updateFilter('name', '');
                break;
            case 'Unpaid':
                updateFilter('unpaid', false);
                break;
            default:
                break;
        }
    };

    return (
        <div className="w-full px-4 py-6 md:py-10 md:px-6">
            <h1 className="text-2xl lg:text-3xl font-bold border-b-8 border-vtk-yellow">
                {adminMode ? 'All Bills' : 'My Bills'}
            </h1>

            {/* Search and filter section - keep responsive */}
            <div className="mb-6 mt-4">
                <Group position="apart" align="flex-end" mb={10} spacing="sm">
                    <Group spacing={10} style={{ width: '100%', flexDirection: 'column' }} className="lg:flex-row">
                        <TextInput
                            placeholder="Search in all fields"
                            value={filters.searchText}
                            onChange={(e) => updateFilter('searchText', e.target.value)}
                            icon={<AiOutlineSearch size={16} />}
                            style={{ width: '100%' }}
                        />
                        <Group spacing={8} position="apart" style={{ width: '100%' }}>
                            <Chip
                                checked={filters.unpaid}
                                onChange={() => updateFilter('unpaid', !filters.unpaid)}
                                size="sm"
                                variant="filled"
                                color="yellow"
                            >
                                Unpaid Only
                            </Chip>

                            <Group spacing={8}>
                                <Button
                                    variant="subtle"
                                    leftIcon={<AiOutlineFilter size={16} />}
                                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                                    rightIcon={showAdvancedSearch ? <BiChevronUp size={16} /> : <BiChevronDown size={16} />}
                                    compact
                                >
                                    Filters
                                </Button>
                                {activeFilters.length > 0 && (
                                    <Button
                                        variant="subtle"
                                        color="red"
                                        leftIcon={<AiOutlineClear size={16} />}
                                        onClick={clearFilters}
                                        compact
                                    >
                                        Clear
                                    </Button>
                                )}
                            </Group>
                        </Group>
                    </Group>
                </Group>

                {activeFilters.length > 0 && (
                    <Group spacing={6} mb={10}>
                        {activeFilters.map(filter => (
                            <Chip
                                key={filter}
                                size="xs"
                                checked={true}
                                onClick={() => clearSingleFilter(filter)}
                                variant="filled"
                                color="blue"
                                styles={{
                                    label: {
                                        cursor: 'pointer',
                                        '&:hover': { textDecoration: 'line-through' }
                                    }
                                }}
                            >
                                {filter} x
                            </Chip>
                        ))}
                    </Group>
                )}

                <Collapse in={showAdvancedSearch}>
                    <Box p={15} sx={(theme) => ({
                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                        borderRadius: theme.radius.md
                    })}>
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="w-full space-y-4">
                                <div className="flex flex-col lg:flex-row gap-4">
                                    <NumberInput
                                        label="Minimum Amount"
                                        placeholder="Min €"
                                        value={filters.amountMin === undefined ? '' : filters.amountMin}
                                        onChange={(val) => updateFilter('amountMin', val)}
                                        precision={2}
                                        min={0}
                                        removeTrailingZeros
                                        style={{ width: '100%' }}
                                    />
                                    <NumberInput
                                        label="Maximum Amount"
                                        placeholder="Max €"
                                        value={filters.amountMax === undefined ? '' : filters.amountMax}
                                        onChange={(val) => updateFilter('amountMax', val)}
                                        precision={2}
                                        min={0}
                                        removeTrailingZeros
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div className="flex flex-col lg:flex-row gap-4">
                                    <TextInput
                                        label="Start Date"
                                        placeholder="DD/MM/YYYY"
                                        value={startDateInput}
                                        onChange={(e) => {
                                            setStartDateInput(e.target.value);
                                            // Only update the filter when the format is valid
                                            const date = parseDate(e.target.value);
                                            if (date || e.target.value === '') {
                                                const newRange: [Date | null, Date | null] = [date, filters.dateRange[1]];
                                                updateFilter('dateRange', newRange);
                                            }
                                        }}
                                        rightSection={<FiCalendar size={16} color="gray" />}
                                        style={{ width: '100%' }}
                                    />

                                    <TextInput
                                        label="End Date"
                                        placeholder="DD/MM/YYYY"
                                        value={endDateInput}
                                        onChange={(e) => {
                                            setEndDateInput(e.target.value);
                                            // Only update the filter when the format is valid
                                            const date = parseDate(e.target.value);
                                            if (date || e.target.value === '') {
                                                const newRange: [Date | null, Date | null] = [filters.dateRange[0], date];
                                                updateFilter('dateRange', newRange);
                                            }
                                        }}
                                        rightSection={<FiCalendar size={16} color="gray" />}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                <TextInput
                                    label="Name"
                                    placeholder="Filter by name"
                                    value={filters.name}
                                    onChange={(e) => updateFilter('name', e.target.value)}
                                    style={{ width: '100%' }}
                                />
                                <Select
                                    label="Post"
                                    placeholder="All posts"
                                    data={uniquePosts.map(post => ({ value: post, label: post }))}
                                    value={filters.post}
                                    onChange={(val) => updateFilter('post', val || '')}
                                    clearable
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    </Box>
                </Collapse>
            </div>

            {bills.length > 0 ? (
                <>
                    {/* Desktop Table View */}
                    <MediaQuery smallerThan="md" styles={{ display: 'none' }}>
                        <Table className="min-w-full">
                            <thead className="border-b-4 border-vtk-yellow">
                                <tr>
                                    <td className="pr-4" style={{ maxWidth: '250px' }}>
                                        <b>Omschrijving</b>
                                    </td>
                                    <td className="pr-4">
                                        <b>Event</b>
                                    </td>
                                    <td className="pr-4">
                                        <b>Post</b>
                                    </td>
                                    <td className="pr-4">
                                        <b>Naam</b>
                                    </td>
                                    <td className="pr-4">
                                        <b>Datum</b>
                                    </td>
                                    <td className="pr-4">
                                        <b>Bedrag</b>
                                    </td>
                                    <td className="pr-4">
                                        <b>Betaald</b>
                                    </td>
                                    <td className="pr-4">
                                        <b>Ingeboekt</b>
                                    </td>
                                    <td>
                                        <b>Actions</b>
                                    </td>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-vtk-yellow">
                                {currentBills.map((bill: IBill) => (
                                    <BillListItem
                                        key={bill.id}
                                        bill={bill}
                                        onDelete={handleBillDeleted}
                                        adminMode={adminMode}
                                        isMobile={false}
                                    />
                                ))}
                            </tbody>
                        </Table>
                    </MediaQuery>

                    {/* Mobile Card View */}
                    <MediaQuery largerThan="md" styles={{ display: 'none' }}>
                        <div className="space-y-4">
                            {currentBills.map((bill: IBill) => (
                                <BillListItem
                                    key={bill.id}
                                    bill={bill}
                                    onDelete={handleBillDeleted}
                                    adminMode={adminMode}
                                    isMobile={true}
                                />
                            ))}
                        </div>
                    </MediaQuery>

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <Pagination
                                total={totalPages}
                                value={currentPage}
                                onChange={handlePageChange}
                                color="yellow"
                                radius="md"
                                size="sm"
                            />
                        </div>
                    )}

                    {filteredBills.length > 0 ? (
                        <div className="mt-3 text-gray-600 text-center text-sm">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredBills.length)} of {filteredBills.length} bills
                        </div>
                    ) : (
                        <div className="mt-3 text-gray-600 text-center">
                            No bills match the current filters
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <h3 className="text-xl text-gray-600">No bills found</h3>
                </div>
            )}
        </div>
    );
}
