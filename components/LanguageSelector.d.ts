import React from 'react';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

export default function LanguageSelector(props: LanguageSelectorProps): React.ReactElement; 