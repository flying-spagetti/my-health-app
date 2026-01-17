import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { spacing } from '@/constants/theme';
import { getAilyBlogById } from '@/services/db';

// Match the journal list page aesthetic
const JOURNAL_COLORS = {
  warmCream: '#FAF3E1',
  lightBeige: '#F5E7C6',
  vibrantOrange: '#FA8112',
  deepCharcoal: '#222222',
  softShadow: 'rgba(250, 129, 18, 0.15)',
  darkShadow: 'rgba(34, 34, 34, 0.1)',
};

type BlogEntry = {
  id: string;
  entry_date: number;
  photo_uri: string | null;
  photo_asset_id: string | null;
  letter: string | null;
  created_at: number;
};

export default function JournalEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [entry, setEntry] = useState<BlogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  const entryId = Array.isArray(params.id) ? params.id[0] : params.id;

  const loadEntry = useCallback(async () => {
    if (!entryId) return;
    try {
      const data = await getAilyBlogById(entryId);
      setEntry(data);
    } catch (error) {
      console.error('Error loading blog entry:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  useEffect(() => {
    if (!entry?.photo_uri) {
      setImageAspectRatio(null);
      return;
    }

    Image.getSize(
      entry.photo_uri,
      (width, height) => {
        if (width > 0 && height > 0) {
          setImageAspectRatio(width / height);
        } else {
          setImageAspectRatio(null);
        }
      },
      () => setImageAspectRatio(null)
    );
  }, [entry?.photo_uri]);

  const imageHeight = useMemo(() => {
    if (!imageAspectRatio) return 320;
    const contentWidth = Dimensions.get('window').width;
    const calculatedHeight = contentWidth / imageAspectRatio;
    return Math.min(Math.max(calculatedHeight, 280), 500);
  }, [imageAspectRatio]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      {/* Hero Image Section */}
      {entry?.photo_uri && (
        <View style={[styles.heroContainer, { height: imageHeight }]}>
          <Image
            source={{ uri: entry.photo_uri }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <SafeAreaView edges={['top']} style={styles.headerContainer}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <IconSymbol name="chevron.left" size={24} color={JOURNAL_COLORS.warmCream} />
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </View>
      )}

      {/* Content Section */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* If no hero image, show back button at top */}
        {!entry?.photo_uri && (
          <SafeAreaView edges={['top']} style={styles.topHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonAlt}>
              <IconSymbol name="chevron.left" size={24} color={JOURNAL_COLORS.deepCharcoal} />
            </TouchableOpacity>
          </SafeAreaView>
        )}

        {isLoading ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Loading your memory...</Text>
          </View>
        ) : !entry ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Entry not found</Text>
          </View>
        ) : (
          <>
            {/* Date Badge */}
            <View style={styles.dateBadge}>
              <IconSymbol name="calendar" size={18} color={JOURNAL_COLORS.vibrantOrange} />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateText}>{formatDate(entry.entry_date)}</Text>
                <Text style={styles.timeText}>{formatTime(entry.entry_date)}</Text>
              </View>
            </View>

            {/* Letter Content */}
            {entry.letter ? (
              <View style={styles.letterSection}>
                <Text style={styles.letterTitle}>Your Story</Text>
                <Text style={styles.letterBody}>{entry.letter}</Text>
              </View>
            ) : (
              <View style={styles.noLetterContainer}>
                <IconSymbol name="text.bubble" size={48} color={JOURNAL_COLORS.vibrantOrange + '40'} />
                <Text style={styles.noLetterText}>No story written for this memory</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JOURNAL_COLORS.warmCream,
  },
  heroContainer: {
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: JOURNAL_COLORS.deepCharcoal + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: JOURNAL_COLORS.deepCharcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  topHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButtonAlt: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: JOURNAL_COLORS.lightBeige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.huge,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    gap: spacing.sm,
    marginBottom: spacing.xl,
    shadowColor: JOURNAL_COLORS.deepCharcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dateTextContainer: {
    gap: 2,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: JOURNAL_COLORS.deepCharcoal,
    letterSpacing: 0.2,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: JOURNAL_COLORS.deepCharcoal + 'AA',
  },
  letterSection: {
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
    borderRadius: 24,
    shadowColor: JOURNAL_COLORS.deepCharcoal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  letterTitle: {
    fontSize: 24,
    fontFamily: 'Caveat-SemiBold',
    color: JOURNAL_COLORS.vibrantOrange,
    marginBottom: spacing.lg,
    letterSpacing: 0.5,
  },
  letterBody: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: JOURNAL_COLORS.deepCharcoal,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  noLetterContainer: {
    backgroundColor: JOURNAL_COLORS.lightBeige,
    padding: spacing.xxl,
    borderRadius: 24,
    alignItems: 'center',
    gap: spacing.md,
  },
  noLetterText: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: JOURNAL_COLORS.deepCharcoal + 'AA',
    textAlign: 'center',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    minHeight: 200,
  },
  stateText: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: JOURNAL_COLORS.deepCharcoal + 'CC',
    textAlign: 'center',
  },
});
