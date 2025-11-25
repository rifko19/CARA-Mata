import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    LayoutAnimation,
    Platform,
    UIManager
    } from "react-native";
    import { useNavigation } from "@react-navigation/native";
    import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
    import { db } from "../../services/firebaseConfig"; 

    // Aktifkan LayoutAnimation untuk Android
    if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    }

    // Tipe Data
    type WawasanItem = {
    id: string;
    judul: string;
    ringkasan: string;
    kategori: string; 
    isi: string;
    tags?: string[]; 
    gambar?: string;
    createdAt: Timestamp;
    };

    const Wawasan = () => {
    const navigation = useNavigation<any>();

    // State
    const [allData, setAllData] = useState<WawasanItem[]>([]);
    const [filteredData, setFilteredData] = useState<WawasanItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('artikel'); 
    const [searchText, setSearchText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // State khusus untuk FAQ Dropdown (menyimpan ID item yang sedang terbuka)
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // 1. FETCH DATA
    useEffect(() => {
        setIsLoading(true);
        const wawasanRef = collection(db, "wawasan"); 
        const q = query(wawasanRef); 

        const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as WawasanItem));
        
        setAllData(data);
        setIsLoading(false);
        }, (error) => {
        console.error("Error fetch wawasan:", error);
        setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 2. FILTER LOGIC
    useEffect(() => {
        let result = allData;

        // Filter Kategori
        if (activeCategory) {
        result = result.filter(item => item.kategori === activeCategory);
        }

        // Filter Search
        if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        result = result.filter(item => 
            item.judul.toLowerCase().includes(lowerSearch) ||
            item.ringkasan.toLowerCase().includes(lowerSearch) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerSearch)))
        );
        }

        setFilteredData(result);
    }, [allData, activeCategory, searchText]);

    // Fungsi Toggle FAQ
    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id); // Tutup jika diklik lagi
    };


    // --- RENDER ITEM ---
    const renderItem = ({ item }: { item: WawasanItem }) => {
        // Cek apakah ini mode FAQ
        const isFaqMode = activeCategory === 'faq';
        const isExpanded = expandedId === item.id;

        // TAMPILAN KHUSUS FAQ (DROPDOWN)
        if (isFaqMode) {
            return (
                <View className="bg-white border border-gray-400 mb-3 rounded-xl mt-3 overflow-hidden shadow-sm">
                    <TouchableOpacity 
                        onPress={() => toggleExpand(item.id)}
                        activeOpacity={0.7}
                        className={`flex-row justify-between items-center p-4 ${isExpanded ? 'bg-gray-200' : 'bg-white'}`}
                    >
                        {/* Judul sebagai Pertanyaan */}
                        <View className="flex-1 mr-3">
                            <Text className="text-base font-bold text-slate-800 leading-6">
                                {item.judul}
                            </Text>
                        </View>
                        <Ionicons
                            name={isExpanded ? "chevron-up-circle" : "chevron-down-circle-outline"} 
                            size={24}
                            color={isExpanded ? "#2563EB" : "#94A3B8"} 
                        />
                    </TouchableOpacity>

                    {isExpanded && (
                        <View className="p-4 pt-0 bg-gray-200 border-slate-100">
                            <Text className="text-sm text-slate-600 leading-6">
                                {item.isi}
                            </Text>
                            
                            {/* Tags FAQ (Opsional) */}
                            {item.tags && item.tags.length > 0 && (
                                <View style={styles.tagsContainer}>
                                    {item.tags.map((tag, index) => (
                                        <View key={index} style={[styles.tagPill, {backgroundColor: '#E2E8F0'}]}>
                                            <Text style={styles.tagText}>#{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            );
        }

        // TAMPILAN ARTIKEL & TIPS (KARTU BIASA -> PINDAH HALAMAN)
        return (
            <TouchableOpacity
                onPress={() => navigation.navigate('DetailArtikel', { 
                    artikelId: item.id,
                    judul: item.judul 
                })}
                className="bg-white border border-gray-300 p-4 mt-3 mb-4 rounded-xl"
            >
                <Text className="text-lg font-bold text-slate-800 mb-1">{item.judul}</Text>
                <Text className="text-sm text-slate-500 leading-5 mb-3" numberOfLines={3}>
                    {item.ringkasan}
                </Text>
                
                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {item.tags.map((tag, index) => (
                            <View key={index} style={styles.tagPill}>
                                <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-white">
        {/* HEADER & SEARCH */}
        <View className="px-5 pt-4 pb-2 bg-white z-10">
            <View className="mb-4">
            <Text className="text-2xl font-bold text-slate-800">Edukasi Kesehatan Mata</Text>
            <Text className="text-sm text-slate-500">Pelajari tentang katarak dan kesehatan mata</Text>
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center rounded-xl bg-gray-200 px-4 py-2 mb-6">
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
                placeholder="Cari artikel, tips, atau FAQ..."
                className="flex-1 ml-2 text-sm placeholder:text-gray-400"
                value={searchText}
                onChangeText={setSearchText}
            />
            </View>

            {/* Category Tabs */}
            <View className="flex-row gap-2 mb-2">
            {['artikel', 'tips', 'faq'].map((cat) => {
                const isActive = activeCategory === cat;
                const label = cat === 'faq' ? 'FAQ' : cat.charAt(0).toUpperCase() + cat.slice(1) + (cat === 'tips' ? ' Pencegahan' : '');
                
                return (
                <TouchableOpacity
                    key={cat}
                    onPress={() => {
                        setActiveCategory(cat);
                        setExpandedId(null); // Reset dropdown saat ganti tab
                    }}
                    className={`px-4 py-3 rounded-3xl mr-2 ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                    <Text className={`font-bold text-base ${isActive ? 'text-white' : 'text-gray-600'}`}>
                    {label}
                    </Text>
                </TouchableOpacity>
                );
            })}
            </View>
        </View>

        {/* LIST KONTEN */}
        {isLoading ? (
            <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563EB" />
            </View>
        ) : (
            <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View className="mt-10 items-center px-10">
                <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
                <Text className="text-slate-400 text-center mt-2">
                    Tidak ada data ditemukan untuk kategori ini.
                </Text>
                </View>
            }
            />
        )}
        </View>
    );
    };

    // Styling
    const styles = StyleSheet.create({
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    tagPill: {
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: 4,
    },
    tagText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '500',
    },
    });

    export default Wawasan;