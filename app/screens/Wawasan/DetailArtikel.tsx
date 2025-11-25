import React, { useState, useEffect } from "react";
import {
    ScrollView,
    View,
    Text,
    Image,
    ActivityIndicator,
    Dimensions,
    StyleSheet
    } from "react-native";
    import { useRoute } from "@react-navigation/native";
    import { doc, getDoc } from "firebase/firestore";
    import { db } from "../../services/firebaseConfig"; // Sesuaikan path

    const { width } = Dimensions.get('window');

    type WawasanDetail = {
    id: string;
    judul: string;
    isi: string;
    gambar?: string;
    kategori: string;
    tags?: string[];
    createdAt: any;
    };

    const DetailArtikel = () => {
    const route = useRoute();
    const { artikelId } = route.params as { artikelId: string };

    const [artikel, setArtikel] = useState<WawasanDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
        try {
            // Pastikan nama koleksi 'Wawasan' (W Besar)
            const docRef = doc(db, "wawasan", artikelId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
            setArtikel({ id: docSnap.id, ...docSnap.data() } as WawasanDetail);
            }
        } catch (error) {
            console.error("Gagal ambil artikel:", error);
        } finally {
            setIsLoading(false);
        }
        };

        if (artikelId) fetchDetail();
    }, [artikelId]);

    // --- FUNGSI PARSING BARU UNTUK BOLD TEXT ---
    const parseBoldText = (text: string) => {
        // Pecah teks berdasarkan tanda **
        const parts = text.split(/(\*\*.*?\*\*)/g);

        return parts.map((part, index) => {
        // Jika bagian ini diawali dan diakhiri dengan **, maka ini Bold
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
            <Text key={index} style={{ fontWeight: 'bold', color: '#0F172A' }}>
                {part.slice(2, -2)} {/* Hapus tanda ** */}
            </Text>
            );
        }
        // Jika tidak, return teks biasa
        return <Text key={index}>{part}</Text>;
        });
    };

    // --- FUNGSI RENDER CONTENT UTAMA ---
    const renderContent = (content: string) => {
        if (!content) return null;

        const cleanContent = content.replace(/\\n/g, '\n');
        const lines = cleanContent.split('\n');

        return lines.map((line, index) => {
        const trimmedLine = line.trim();

        if (trimmedLine.length === 0) {
            return <View key={index} style={{ height: 12 }} />;
        }

        // A. Heading (###)
        if (trimmedLine.startsWith('###')) {
            return (
            <Text key={index} style={styles.subHeader}>
                {trimmedLine.replace('###', '').trim()}
            </Text>
            );
        }

        // B. List Item (-)
        if (trimmedLine.startsWith('-') || /^\d+\./.test(trimmedLine)) {
            const textContent = trimmedLine.replace(/^[-*]\s*/, '').trim();
            return (
            <View key={index} style={styles.listItemContainer}>
                <View style={styles.bulletPoint} />
                <Text style={styles.paragraph}>
                {/* Panggil fungsi parseBoldText di sini */}
                {parseBoldText(textContent)}
                </Text>
            </View>
            );
        }

        // C. Paragraf Biasa
        return (
            <Text key={index} style={styles.paragraph}>
            {/* Panggil fungsi parseBoldText di sini juga */}
            {parseBoldText(trimmedLine)}
            </Text>
        );
        });
    };
    // -------------------------------------------

    if (isLoading) {
        return (
        <View className="flex-1 justify-center items-center bg-white">
            <ActivityIndicator size="large" color="#2563EB" />
        </View>
        );
    }

    if (!artikel) {
        return (
        <View className="flex-1 justify-center items-center bg-white">
            <Text className="text-slate-500">Artikel tidak ditemukan.</Text>
        </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
        
        {/* Header Image */}
        {artikel.gambar ? (
            <Image
            source={{ uri: artikel.gambar }}
            style={{ width: width, height: 300 }}
            resizeMode="cover"
            />
        ) : (
            <View className="bg-blue-50 h-48 w-full justify-center items-center mb-4">
                <Text className="text-blue-300 font-bold text-4xl opacity-20">CARA-Mata</Text>
            </View>
        )}

        {/* Content Container */}
        <View style={styles.contentContainer}>
            
            {/* Tags & Kategori */}
            <View className="flex-row flex-wrap gap-2 mb-4">
                 {/* Tags & Kategori */}
                <View className="flex-row flex-wrap gap-2 mb-4">
                    {artikel.tags && artikel.tags.map((tag, idx) => (
                        <View key={idx} className="bg-blue-100 px-3 py-1 mx-2 rounded-full">
                            <Text className="text-blue-700 text-xs font-bold">{tag}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Judul Utama */}
            <Text style={styles.mainTitle}>
            {artikel.judul}
            </Text>

            {/* Isi Artikel */}
            <View style={styles.articleBody}>
                {renderContent(artikel.isi)}
            </View>

            {/* Footer */}
            <View className="mt-10 border-t border-slate-100 pt-4 mb-8">
                <Text className="text-xs text-slate-400 text-center italic">
                    Informasi ini hanya untuk edukasi
                </Text>
            </View>

        </View>
        </ScrollView>
    );
    };

    // Styling
    const styles = StyleSheet.create({
    contentContainer: {
        padding: 20,
        marginTop: -24,
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 500,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 16,
        lineHeight: 34,
    },
    articleBody: {
        marginTop: 8,
    },
    subHeader: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 24,
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 26,
        marginBottom: 12,
        textAlign: 'justify',
    },
    listItemContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        paddingLeft: 4,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2563EB',
        marginTop: 10,
        marginRight: 12,
    }
    });

    export default DetailArtikel;