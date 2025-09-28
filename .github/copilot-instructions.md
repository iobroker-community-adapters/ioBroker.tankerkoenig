# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

### Adapter-Specific Context

This is the **tankerkoenig** adapter for ioBroker, which provides fuel price data from the tankerkoenig.de API. Key characteristics:

- **Primary Function**: Retrieves current fuel prices (Diesel, E5, E10) from German gas stations
- **Data Source**: tankerkoenig.de API (official MTS-K data)
- **Target Users**: German users monitoring fuel prices for cost optimization
- **Key Features**: Station search by location/postal code, price monitoring, price change alerts
- **Configuration Requirements**: API key from tankerkoenig.de, geographic location settings
- **Update Frequency**: Configurable intervals for price updates (typically every 10-60 minutes)
- **Admin Interface**: React-based configuration UI for station selection and settings

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Focus on adapter lifecycle methods: `ready()`, `unload()`, `stateChange()`
- Test API communication and error handling scenarios
- Mock external API calls to tankerkoenig.de for consistent testing
- Test data validation and state creation/updates

### Integration Testing
- Test the complete adapter lifecycle in a test ioBroker environment
- Verify proper cleanup of timers, intervals, and connections in `unload()`
- Test configuration validation and error scenarios
- Validate state structure matches io-package.json definitions

## Configuration Structure

### ioBroker Configuration (io-package.json)
```json
{
  "common": {
    "name": "tankerkoenig",
    "version": "...",
    "title": "Tankerkönig fuel prices",
    "titleLang": {
      "en": "Tankerkönig fuel prices",
      "de": "Tankerkönig Spritpreise"
    }
  },
  "objects": [],
  "instanceObjects": []
}
```

### Adapter Configuration
- API key validation and encryption
- Station selection interface with search capabilities
- Geographic coordinate configuration
- Update interval settings
- Price change threshold configuration for alerts

## Code Architecture

### Main Adapter Class
```typescript
class TankerkoenigAdapter extends utils.Adapter {
  constructor(options: Partial<utils.AdapterOptions> = {}) {
    super({
      ...options,
      name: 'tankerkoenig',
    });
  }

  async onReady(): Promise<void> {
    // Initialize API client
    // Load station configuration
    // Start price update cycle
  }

  async onUnload(callback: () => void): Promise<void> {
    // Clean up timers
    // Clear API requests
    callback();
  }
}
```

### API Integration
- HTTP client setup for tankerkoenig.de API endpoints
- Proper error handling for API rate limits and outages
- Request throttling to respect API usage limits
- Response validation and data sanitization

### State Management
- Create device objects for each configured station
- Organize states by fuel type (diesel, e5, e10) per station
- Maintain station metadata (name, brand, location)
- Track last update timestamps and API status

## ioBroker Development Patterns

### Adapter Initialization
```typescript
this.on('ready', this.onReady.bind(this));
this.on('stateChange', this.onStateChange.bind(this));
this.on('unload', this.onUnload.bind(this));
```

### State Creation and Updates
```typescript
// Create device
await this.setObjectNotExistsAsync(`stations.${stationId}`, {
  type: 'device',
  common: {
    name: stationName,
  },
  native: {},
});

// Update price state
await this.setStateAsync(`stations.${stationId}.diesel`, {
  val: price,
  ack: true,
  ts: Date.now()
});
```

### Configuration Access
```typescript
const apiKey = this.config.apiKey;
const stations = this.config.stations || [];
```

### Logging Best Practices
```typescript
this.log.info('Starting price update for ' + stations.length + ' stations');
this.log.warn('API rate limit approaching');
this.log.error('Failed to fetch prices: ' + error.message);
this.log.debug('API response: ' + JSON.stringify(data));
```

### Error Handling
```typescript
try {
  const response = await this.apiClient.getPrices(stationIds);
  // Process response
} catch (error) {
  this.log.error('API request failed: ' + error.message);
  // Set connection state to false
  await this.setStateAsync('info.connection', false, true);
}
```

## Code Quality

### TypeScript Best Practices
- Use strict type checking
- Define interfaces for API responses and configuration
- Implement proper error types
- Use async/await for asynchronous operations

### ESLint Configuration
```json
{
  "extends": ["@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### Code Documentation
- Document all public methods with JSDoc
- Include parameter types and return types
- Provide usage examples for complex functions
- Document API rate limits and constraints

## Performance Considerations

### API Optimization
- Batch station requests to minimize API calls
- Implement intelligent update intervals based on price change frequency
- Cache station metadata to reduce repeated API calls
- Use conditional requests when supported by API

### Memory Management
- Clear old price data to prevent memory leaks
- Implement proper cleanup in unload method
- Monitor adapter memory usage in long-running scenarios

### Network Efficiency
- Implement proper retry logic with exponential backoff
- Handle network timeouts gracefully
- Use connection pooling for HTTP requests

## Security Best Practices

### API Key Management
- Store API keys encrypted using adapter encryption methods
- Validate API key format before making requests
- Never log API keys or expose them in error messages
- Implement key rotation procedures

### Input Validation
- Sanitize all user inputs from configuration
- Validate station IDs and geographic coordinates
- Check price data for reasonable ranges
- Prevent injection attacks in search parameters

## Admin Interface (React)

### Component Structure
```typescript
import { AdminComponent } from 'iobroker-react';

const TankerkoenigConfig: React.FC = () => {
  const [config, setConfig] = useState<ConfigType>({});
  
  return (
    <AdminComponent>
      {/* Station search and selection */}
      {/* API key configuration */}
      {/* Update interval settings */}
    </AdminComponent>
  );
};
```

### Configuration Validation
- Real-time API key validation
- Station availability verification
- Geographic coordinate validation
- Price update interval range checking

### User Experience
- Progressive loading for station search
- Clear error messages with resolution suggestions
- Helpful tooltips and documentation links
- Responsive design for different screen sizes

## Deployment and Maintenance

### Version Management
- Follow semantic versioning (semver)
- Update changelog with each release
- Test migration paths between versions
- Maintain backwards compatibility when possible

### Monitoring and Diagnostics
- Implement health checks for API connectivity
- Track success/failure rates for price updates
- Monitor adapter performance metrics
- Log configuration changes and errors

### Documentation Updates
- Keep README.md current with features and configuration
- Update German and English documentation in parallel
- Provide migration guides for major version changes
- Include troubleshooting section for common issues

## Common Patterns and Utilities

### Retry Logic
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Configuration Schema Validation
```typescript
import Joi from 'joi';

const configSchema = Joi.object({
  apiKey: Joi.string().required(),
  stations: Joi.array().items(Joi.string()).min(1),
  updateInterval: Joi.number().min(600).max(3600).default(1800)
});
```

### State Management Helpers
```typescript
async function updateStationPrices(
  stationId: string, 
  prices: PriceData
): Promise<void> {
  const promises = Object.entries(prices).map(([fuelType, price]) =>
    this.setStateAsync(`stations.${stationId}.${fuelType}`, {
      val: price,
      ack: true,
      ts: Date.now()
    })
  );
  await Promise.all(promises);
}
```

## Troubleshooting Common Issues

### API Connection Problems
- Verify API key validity and remaining quota
- Check network connectivity and DNS resolution
- Review API rate limiting and implement backoff
- Monitor tankerkoenig.de service status

### Configuration Issues
- Validate station IDs exist and are active
- Check geographic coordinates are within Germany
- Ensure update intervals respect API limits
- Verify encrypted configuration storage

### Performance Issues
- Review update frequency vs. actual price change rates
- Optimize batch API requests
- Monitor memory usage and cleanup patterns
- Check for blocking operations in main thread

Remember to:
- Always use the latest ioBroker adapter development tools
- Follow the official ioBroker adapter development guidelines
- Test thoroughly with different configuration scenarios
- Consider the impact on users' ioBroker systems and network usage
- Keep the adapter lightweight and efficient for 24/7 operation