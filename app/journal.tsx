import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { spacing } from '@/constants/theme';
import { deleteAilyBlog, getAilyBlogs, saveAilyBlog } from '@/services/db';

// Custom color palette for this page
const JOURNAL_COLORS = {
  warmCream: '#FAF3E1',
  lightBeige: '#F5E7C6',
  vibrantOrange: '#FA8112',
  deepCharcoal: '#222222',
  softShadow: 'rgba(250, 129, 18, 0.15)',
  darkShadow: 'rgba(34, 34, 34, 0.1)',
  overlayDark: 'rgba(34, 34, 34, 0.4)',
  overlayGradient: 'rgba(250, 243, 225, 0.85)',
};

type BlogEntry = {
  id: string;
  entry_date: number;
  photo_uri: string | null;
  photo_asset_id: string | null;
  letter: string | null;
  created_at: number;
};

const { width } = Dimensions.get('window');
const cardWidth = width - spacing.xl * 2;

export default function JournalScreen() {
  const router = useRouter();

  // List state
  const [blogs, setBlogs] = useState<BlogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollY = new Animated.Value(0);

  // New entry state
  const [isCreating, setIsCreating] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoAssetId, setPhotoAssetId] = useState<string | null>(null);
  const [letter, setLetter] = useState('');
  const [entryDate, setEntryDate] = useState(new Date());
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadBlogs = useCallback(async () => {
    try {
      const data = await getAilyBlogs();
      setBlogs(data);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBlogs();
    }, [loadBlogs])
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoAssetId(result.assets[0].assetId || null);
    }
  };

  const formatDate = (date: Date | number) => {
    const d = typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleDateEdit = () => {
    setDateInput(entryDate.toISOString().split('T')[0]);
    setIsEditingDate(true);
  };

  const handleDateSave = () => {
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      const newDate = new Date(entryDate);
      newDate.setFullYear(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      setEntryDate(newDate);
    }
    setIsEditingDate(false);
  };

  const handleSave = async () => {
    if (!letter.trim() && !photoUri) {
      Alert.alert('Empty entry', 'Please add a photo or write something.');
      return;
    }

    setIsSaving(true);
    try {
      await saveAilyBlog({
        entry_date: entryDate.getTime(),
        photo_uri: photoUri,
        photo_asset_id: photoAssetId,
        letter: letter.trim() || null,
      });

      // Reset form
      setPhotoUri(null);
      setPhotoAssetId(null);
      setLetter('');
      setEntryDate(new Date());
      setIsCreating(false);

      // Reload blogs
      loadBlogs();
    } catch (error) {
      console.error('Error saving blog entry:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAilyBlog(id);
            loadBlogs();
          } catch (error) {
            console.error('Error deleting blog:', error);
          }
        },
      },
    ]);
  };

  const cancelCreate = () => {
    setPhotoUri(null);
    setPhotoAssetId(null);
    setLetter('');
    setEntryDate(new Date());
    setIsCreating(false);
  };

  const renderBlogItem = ({ item, index }: { item: BlogEntry; index: number }) => (
    <Pressable
      style={({ pressed }) => [
        styles.blogCard,
        { opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={() => router.push({ pathname: '/journal/[id]', params: { id: item.id } })}
      onLongPress={() => handleDelete(item.id)}
    >
      {item.photo_uri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.photo_uri }} style={styles.blogImage} resizeMode="cover" />
        </View>
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: JOURNAL_COLORS.lightBeige }]}>
          <IconSymbol name="photo" size={48} color={JOURNAL_COLORS.vibrantOrange} />
        </View>
      )}
      
      <View style={styles.cardContent}>
        <Text style={styles.cardDate}>{formatDate(item.entry_date)}</Text>
        
        {item.letter && (
          <>
            <Text style={styles.letterPreview} numberOfLines={3}>
              {item.letter}
            </Text>
            <View style={styles.readMore}>
              <Text style={styles.readMoreText}>Read more</Text>
              <IconSymbol name="arrow.right" size={14} color={JOURNAL_COLORS.vibrantOrange} />
            </View>
          </>
        )}
      </View>
    </Pressable>
  );

  // Create new entry view
  if (isCreating) {
    return (
      <SafeAreaView style={styles.createContainer} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
              <>
                {/* Header */}
                <View style={styles.createHeader}>
                  <TouchableOpacity onPress={cancelCreate} style={styles.iconButton}>
                    <IconSymbol name="xmark" size={24} color={JOURNAL_COLORS.deepCharcoal} />
                  </TouchableOpacity>
                  <Text style={styles.createTitle}>New Memory</Text>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    style={[styles.saveButton, isSaving && { opacity: 0.5 }]}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Photo Area */}
                <TouchableOpacity
                  style={styles.photoUploadArea}
                  onPress={pickImage}
                  activeOpacity={0.9}
                >
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.uploadedImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <View style={styles.uploadIconCircle}>
                        <IconSymbol name="camera.fill" size={32} color={JOURNAL_COLORS.vibrantOrange} />
                      </View>
                      <Text style={styles.uploadTitle}>Add a photo</Text>
                      <Text style={styles.uploadSubtitle}>Capture the moment</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Date Section */}
                <Pressable style={styles.dateCard} onPress={handleDateEdit}>
                  <IconSymbol name="calendar" size={20} color={JOURNAL_COLORS.vibrantOrange} />
                  {isEditingDate ? (
                    <View style={styles.dateEditContainer}>
                      <TextInput
                        style={styles.dateEditInput}
                        value={dateInput}
                        onChangeText={setDateInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={JOURNAL_COLORS.deepCharcoal + '60'}
                        autoFocus
                        onBlur={handleDateSave}
                        onSubmitEditing={handleDateSave}
                      />
                      <TouchableOpacity onPress={handleDateSave}>
                        <IconSymbol name="checkmark.circle.fill" size={24} color={JOURNAL_COLORS.vibrantOrange} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.dateDisplayContainer}>
                      <Text style={styles.dateDisplayText}>{formatDate(entryDate)}</Text>
                      <Text style={styles.timeDisplayText}>{formatTime(entryDate)}</Text>
                    </View>
                  )}
                </Pressable>

                {/* Letter Section */}
                <View style={styles.letterCard}>
                  <Text style={styles.letterCardTitle}>Your Story</Text>
                  <TextInput
                    style={styles.letterTextArea}
                    value={letter}
                    onChangeText={setLetter}
                    placeholder="Write about this moment, how it made you feel, what it means to you..."
                    placeholderTextColor={JOURNAL_COLORS.deepCharcoal + '40'}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </>
            }
            contentContainerStyle={styles.createContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Header Component
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <IconSymbol name="chevron.left" size={24} color={JOURNAL_COLORS.deepCharcoal} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Ammu's Corner</Text>
            <Text style={styles.headerSubtitle}>Personal Diary</Text>
          </View>
          <View style={styles.iconButton} />
        </View>
      </SafeAreaView>
    </View>
  );

  // Blog list view
  return (
    <View style={styles.container}>
      {isLoading ? (
        <SafeAreaView style={styles.emptyState} edges={['top']}>
          <Text style={styles.loadingText}>Loading your diary...</Text>
        </SafeAreaView>
      ) : blogs.length === 0 ? (
        <SafeAreaView style={styles.emptyState} edges={['top']}>
          <View style={styles.emptyIconContainer}>
            <IconSymbol name="book.closed.fill" size={64} color={JOURNAL_COLORS.vibrantOrange} />
          </View>
          <Text style={styles.emptyTitle}>Your story begins here</Text>
          <Text style={styles.emptySubtitle}>
            Capture moments, preserve memories,{'\n'}and reflect on your journey
          </Text>
        </SafeAreaView>
      ) : (
        <Animated.FlatList
          data={blogs}
          keyExtractor={(item) => item.id}
          renderItem={renderBlogItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreating(true)}
        activeOpacity={0.85}
      >
        <IconSymbol name="plus" size={28} color={JOURNAL_COLORS.warmCream} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JOURNAL_COLORS.warmCream,
  },
  createContainer: {
    flex: 1,
    backgroundColor: JOURNAL_COLORS.warmCream,
  },
  keyboardView: {
    flex: 1,
  },
  
  // Header Styles
  headerContainer: {
    backgroundColor: JOURNAL_COLORS.warmCream,
    paddingBottom: spacing.md,
  },
  headerSafeArea: {
    backgroundColor: JOURNAL_COLORS.warmCream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Caveat-SemiBold',
    color: JOURNAL_COLORS.deepCharcoal,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    color: JOURNAL_COLORS.vibrantOrange,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: JOURNAL_COLORS.lightBeige,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List Styles
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  blogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    shadowColor: JOURNAL_COLORS.deepCharcoal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    height: 280,
  },
  blogImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: spacing.lg,
  },
  cardDate: {
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
    color: JOURNAL_COLORS.deepCharcoal,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    opacity: 0.6,
  },
  letterPreview: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: JOURNAL_COLORS.deepCharcoal,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  readMoreText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: JOURNAL_COLORS.vibrantOrange,
    letterSpacing: 0.3,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: JOURNAL_COLORS.lightBeige,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Caveat-SemiBold',
    color: JOURNAL_COLORS.deepCharcoal,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: JOURNAL_COLORS.deepCharcoal + 'CC',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: JOURNAL_COLORS.deepCharcoal + 'CC',
  },

  // Create Entry Styles
  createContent: {
    padding: spacing.xl,
    paddingBottom: spacing.huge,
  },
  createHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  createTitle: {
    fontSize: 28,
    fontFamily: 'Caveat-SemiBold',
    color: JOURNAL_COLORS.deepCharcoal,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: JOURNAL_COLORS.vibrantOrange,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  saveButtonText: {
    color: JOURNAL_COLORS.warmCream,
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    letterSpacing: 0.5,
  },
  photoUploadArea: {
    width: '100%',
    height: 320,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: JOURNAL_COLORS.deepCharcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: JOURNAL_COLORS.lightBeige,
  },
  uploadIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: JOURNAL_COLORS.warmCream,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  uploadTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-SemiBold',
    color: JOURNAL_COLORS.deepCharcoal,
    marginBottom: spacing.xs,
  },
  uploadSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: JOURNAL_COLORS.deepCharcoal + 'AA',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
    gap: spacing.md,
    shadowColor: JOURNAL_COLORS.deepCharcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dateEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateEditInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: JOURNAL_COLORS.deepCharcoal,
    borderWidth: 1,
    borderColor: JOURNAL_COLORS.lightBeige,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateDisplayContainer: {
    flex: 1,
  },
  dateDisplayText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: JOURNAL_COLORS.deepCharcoal,
  },
  timeDisplayText: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: JOURNAL_COLORS.deepCharcoal + 'AA',
    marginTop: 2,
  },
  letterCard: {
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
    borderRadius: 20,
    minHeight: 300,
    shadowColor: JOURNAL_COLORS.deepCharcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  letterCardTitle: {
    fontSize: 20,
    fontFamily: 'Caveat-SemiBold',
    color: JOURNAL_COLORS.vibrantOrange,
    marginBottom: spacing.md,
  },
  letterTextArea: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: JOURNAL_COLORS.deepCharcoal,
    lineHeight: 26,
    minHeight: 220,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: JOURNAL_COLORS.vibrantOrange,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: JOURNAL_COLORS.vibrantOrange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
});
