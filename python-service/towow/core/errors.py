class TowowError(Exception):
    pass

class EngineError(TowowError):
    pass

class SkillError(TowowError):
    pass

class AdapterError(TowowError):
    pass

class LLMError(TowowError):
    pass

class EncodingError(TowowError):
    pass

class ConfigError(TowowError):
    pass
